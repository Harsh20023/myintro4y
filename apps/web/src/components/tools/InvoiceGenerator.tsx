// 'use client'

// import { useState, useCallback } from 'react'
// import { Plus, Trash2, Download, Printer, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
// import { Input, Select, Textarea, Card, Divider } from '@/components/ui'
// import {
//   InvoiceData, InvoiceItem,
//   DEFAULT_INVOICE, CURRENCIES, GST_RATES,
//   calcItem, calcTotals, formatCurrency, newItem, generateInvoiceNumber,
// } from '@/lib/logic/invoice'

// // ── Invoice Preview ──────────────────────────────────────────────────────
// function InvoicePreview({ data }: { data: InvoiceData }) {
//   const totals = calcTotals(data.items)
//   const hasIGST = data.items.some(i => i.gstType === 'igst')
//   const hasCGST = data.items.some(i => i.gstType === 'cgst_sgst')

//   return (
//     <div id="invoice-preview" className="bg-white rounded-2xl border border-ink-100 shadow-sm overflow-hidden text-sm">
//       {/* Header */}
//       <div className="bg-brand-600 px-6 py-5 flex justify-between items-start">
//         <div>
//           <p className="text-brand-100 text-xs font-medium uppercase tracking-widest mb-1">Tax Invoice</p>
//           <h2 className="text-white font-display font-bold text-xl">{data.sellerName || 'Your Business'}</h2>
//           {data.sellerAddress && <p className="text-brand-200 text-xs mt-1 max-w-xs">{data.sellerAddress}</p>}
//         </div>
//         <div className="text-right">
//           <p className="text-white font-mono font-medium">{data.invoiceNumber}</p>
//           <p className="text-brand-200 text-xs mt-1">Date: {data.invoiceDate}</p>
//           <p className="text-brand-200 text-xs">Due: {data.dueDate}</p>
//         </div>
//       </div>

//       {/* Seller + Buyer */}
//       <div className="grid grid-cols-2 gap-4 px-6 py-4 bg-ink-50">
//         <div>
//           <p className="text-xs font-medium uppercase tracking-wider text-ink-400 mb-1">From</p>
//           {data.sellerGST   && <p className="text-ink-600 text-xs">GSTIN: {data.sellerGST}</p>}
//           {data.sellerPhone && <p className="text-ink-600 text-xs">{data.sellerPhone}</p>}
//           {data.sellerEmail && <p className="text-ink-600 text-xs">{data.sellerEmail}</p>}
//           {!data.sellerGST && !data.sellerPhone && <p className="text-ink-300 text-xs italic">Fill seller details</p>}
//         </div>
//         <div>
//           <p className="text-xs font-medium uppercase tracking-wider text-ink-400 mb-1">Bill To</p>
//           <p className="font-medium text-ink-800">{data.buyerName || <span className="text-ink-300 italic font-normal">Client name</span>}</p>
//           {data.buyerAddress && <p className="text-ink-600 text-xs mt-0.5">{data.buyerAddress}</p>}
//           {data.buyerGST     && <p className="text-ink-600 text-xs">GSTIN: {data.buyerGST}</p>}
//         </div>
//       </div>

//       {/* Items table */}
//       <div className="px-6 py-4">
//         <table className="w-full text-xs">
//           <thead>
//             <tr className="border-b border-ink-100">
//               <th className="text-left pb-2 text-ink-400 font-medium w-6">#</th>
//               <th className="text-left pb-2 text-ink-400 font-medium">Description</th>
//               <th className="text-right pb-2 text-ink-400 font-medium w-12">Qty</th>
//               <th className="text-right pb-2 text-ink-400 font-medium w-20">Rate</th>
//               <th className="text-right pb-2 text-ink-400 font-medium w-20">Taxable</th>
//               {hasCGST && <>
//                 <th className="text-right pb-2 text-ink-400 font-medium w-16">CGST</th>
//                 <th className="text-right pb-2 text-ink-400 font-medium w-16">SGST</th>
//               </>}
//               {hasIGST && <th className="text-right pb-2 text-ink-400 font-medium w-16">IGST</th>}
//               <th className="text-right pb-2 text-ink-400 font-medium w-20">Total</th>
//             </tr>
//           </thead>
//           <tbody>
//             {data.items.map((item, i) => {
//               const c = calcItem(item)
//               return (
//                 <tr key={item.id} className="border-b border-ink-50">
//                   <td className="py-2 text-ink-400">{i + 1}</td>
//                   <td className="py-2 text-ink-700">{item.description || <span className="italic text-ink-300">Item description</span>}</td>
//                   <td className="py-2 text-right text-ink-600">{item.quantity}</td>
//                   <td className="py-2 text-right text-ink-600">{formatCurrency(item.rate, data.currency)}</td>
//                   <td className="py-2 text-right text-ink-600">{formatCurrency(c.subtotal, data.currency)}</td>
//                   {hasCGST && <>
//                     <td className="py-2 text-right text-ink-500">{formatCurrency(c.cgst, data.currency)}<br/><span className="text-ink-300">({item.gstRate/2}%)</span></td>
//                     <td className="py-2 text-right text-ink-500">{formatCurrency(c.sgst, data.currency)}<br/><span className="text-ink-300">({item.gstRate/2}%)</span></td>
//                   </>}
//                   {hasIGST && <td className="py-2 text-right text-ink-500">{formatCurrency(c.igst, data.currency)}<br/><span className="text-ink-300">({item.gstRate}%)</span></td>}
//                   <td className="py-2 text-right font-medium text-ink-800">{formatCurrency(c.total, data.currency)}</td>
//                 </tr>
//               )
//             })}
//           </tbody>
//         </table>
//       </div>

//       {/* Totals */}
//       <div className="px-6 pb-5 flex justify-end">
//         <div className="w-56 space-y-1.5">
//           <div className="flex justify-between text-xs text-ink-500">
//             <span>Subtotal</span>
//             <span>{formatCurrency(totals.subtotal, data.currency)}</span>
//           </div>
//           {hasCGST && <>
//             <div className="flex justify-between text-xs text-ink-500">
//               <span>CGST</span><span>{formatCurrency(totals.totalCGST, data.currency)}</span>
//             </div>
//             <div className="flex justify-between text-xs text-ink-500">
//               <span>SGST</span><span>{formatCurrency(totals.totalSGST, data.currency)}</span>
//             </div>
//           </>}
//           {hasIGST && (
//             <div className="flex justify-between text-xs text-ink-500">
//               <span>IGST</span><span>{formatCurrency(totals.totalIGST, data.currency)}</span>
//             </div>
//           )}
//           <div className="flex justify-between text-xs text-ink-500 border-t border-ink-100 pt-1.5">
//             <span>Total GST</span><span>{formatCurrency(totals.totalGST, data.currency)}</span>
//           </div>
//           <div className="flex justify-between font-semibold text-sm text-white bg-brand-600 rounded-lg px-3 py-2 mt-2">
//             <span>Grand Total</span>
//             <span>{formatCurrency(totals.grandTotal, data.currency)}</span>
//           </div>
//         </div>
//       </div>

//       {/* Notes */}
//       {(data.notes || data.termsAndConditions) && (
//         <div className="px-6 pb-5 pt-2 border-t border-ink-100 space-y-3">
//           {data.notes && (
//             <div>
//               <p className="text-xs font-medium text-ink-400 uppercase tracking-wider mb-1">Notes</p>
//               <p className="text-xs text-ink-600">{data.notes}</p>
//             </div>
//           )}
//           {data.termsAndConditions && (
//             <div>
//               <p className="text-xs font-medium text-ink-400 uppercase tracking-wider mb-1">Terms & Conditions</p>
//               <p className="text-xs text-ink-500">{data.termsAndConditions}</p>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   )
// }

// // ── Item Row ───────────────────────────────────────────────────────────────
// function ItemRow({
//   item, index, onChange, onRemove, currency, canRemove,
// }: {
//   item: InvoiceItem
//   index: number
//   onChange: (id: string, field: keyof InvoiceItem, value: string | number) => void
//   onRemove: (id: string) => void
//   currency: string
//   canRemove: boolean
// }) {
//   const c = calcItem(item)
//   return (
//     <div className="grid gap-2 p-3 bg-ink-50 rounded-xl border border-ink-100">
//       <div className="flex items-center justify-between">
//         <span className="text-xs font-medium text-ink-400">Item {index + 1}</span>
//         {canRemove && (
//           <button onClick={() => onRemove(item.id)} className="p-1 text-ink-300 hover:text-red-400 transition-colors" aria-label="Remove item">
//             <Trash2 size={13} />
//           </button>
//         )}
//       </div>
//       <Input
//         placeholder="Item description"
//         value={item.description}
//         onChange={e => onChange(item.id, 'description', e.target.value)}
//       />
//       <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
//         <Input
//           label="Qty"
//           type="number" min="1"
//           value={item.quantity}
//           onChange={e => onChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
//         />
//         <Input
//           label="Rate"
//           type="number" min="0" step="0.01"
//           prefix={currency === 'INR' ? '₹' : undefined}
//           value={item.rate}
//           onChange={e => onChange(item.id, 'rate', parseFloat(e.target.value) || 0)}
//         />
//         <Select
//           label="GST %"
//           value={item.gstRate}
//           options={GST_RATES.map(r => ({ value: String(r), label: `${r}%` }))}
//           onChange={e => onChange(item.id, 'gstRate', parseInt(e.target.value))}
//         />
//         <Select
//           label="Type"
//           value={item.gstType}
//           options={[
//             { value: 'none',      label: 'No GST' },
//             { value: 'cgst_sgst', label: 'CGST+SGST' },
//             { value: 'igst',      label: 'IGST' },
//           ]}
//           onChange={e => onChange(item.id, 'gstType', e.target.value)}
//         />
//       </div>
//       <div className="flex justify-end">
//         <span className="text-xs text-ink-400">Total: <span className="font-medium text-ink-700">{formatCurrency(c.total, item.gstType === 'none' ? 'INR' : 'INR')}</span></span>
//       </div>
//     </div>
//   )
// }

// // ── Section toggle ─────────────────────────────────────────────────────────
// function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
//   const [open, setOpen] = useState(defaultOpen)
//   return (
//     <div>
//       <button
//         onClick={() => setOpen(!open)}
//         className="w-full flex items-center justify-between py-2 text-left"
//       >
//         <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">{title}</span>
//         {open ? <ChevronUp size={14} className="text-ink-400" /> : <ChevronDown size={14} className="text-ink-400" />}
//       </button>
//       {open && <div className="space-y-3 pt-1">{children}</div>}
//     </div>
//   )
// }

// // ── Main Component ─────────────────────────────────────────────────────────
// export function InvoiceGenerator() {
//   const [data, setData] = useState<InvoiceData>(DEFAULT_INVOICE)
//   const [downloading, setDownloading] = useState(false)

//   const set = useCallback(<K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => {
//     setData(prev => ({ ...prev, [field]: value }))
//   }, [])

//   const updateItem = useCallback((id: string, field: keyof InvoiceItem, value: string | number) => {
//     setData(prev => ({
//       ...prev,
//       items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item),
//     }))
//   }, [])

//   const addItem    = () => setData(prev => ({ ...prev, items: [...prev.items, newItem()] }))
//   const removeItem = (id: string) => setData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }))
//   const resetInvoice = () => setData({ ...DEFAULT_INVOICE, invoiceNumber: generateInvoiceNumber() })

//   const handleDownload = async () => {
//     setDownloading(true)
//     try {
//       const { downloadInvoicePDF } = await import('@/lib/logic/pdf')
//       await downloadInvoicePDF(data)
//     } finally {
//       setDownloading(false)
//     }
//   }

//   const handlePrint = () => window.print()

//   return (
//     <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
//       {/* ── Left: Form ── */}
//       <div className="space-y-4 no-print">
//         {/* Action bar */}
//         <div className="flex items-center gap-2 justify-end">
//           <button onClick={resetInvoice} className="btn-ghost text-xs gap-1.5">
//             <RefreshCw size={12} /> Reset
//           </button>
//           <button onClick={handlePrint} className="btn-secondary text-xs gap-1.5">
//             <Printer size={13} /> Print
//           </button>
//           <button onClick={handleDownload} disabled={downloading} className="btn-primary text-xs gap-1.5">
//             <Download size={13} /> {downloading ? 'Generating…' : 'Download PDF'}
//           </button>
//         </div>

//         <Card>
//           <Section title="Invoice Details">
//             <div className="grid grid-cols-2 gap-3">
//               <Input label="Invoice Number" value={data.invoiceNumber} onChange={e => set('invoiceNumber', e.target.value)} />
//               <Select label="Currency" value={data.currency} options={CURRENCIES} onChange={e => set('currency', e.target.value as any)} />
//               <Input label="Invoice Date" type="date" value={data.invoiceDate} onChange={e => set('invoiceDate', e.target.value)} />
//               <Input label="Due Date"     type="date" value={data.dueDate}     onChange={e => set('dueDate',     e.target.value)} />
//             </div>
//           </Section>

//           <Divider />

//           <Section title="Your Business (Seller)">
//             <Input label="Business Name" placeholder="Acme Pvt Ltd" value={data.sellerName} onChange={e => set('sellerName', e.target.value)} />
//             <Textarea label="Address" rows={2} placeholder="123, MG Road, Bengaluru, Karnataka 560001" value={data.sellerAddress} onChange={e => set('sellerAddress', e.target.value)} />
//             <div className="grid grid-cols-2 gap-3">
//               <Input label="GSTIN" placeholder="29AAAAA0000A1Z5" value={data.sellerGST} onChange={e => set('sellerGST', e.target.value)} />
//               <Input label="Phone" type="tel" placeholder="+91 98765 43210" value={data.sellerPhone} onChange={e => set('sellerPhone', e.target.value)} />
//             </div>
//             <Input label="Email" type="email" placeholder="billing@acme.com" value={data.sellerEmail} onChange={e => set('sellerEmail', e.target.value)} />
//           </Section>

//           <Divider />

//           <Section title="Client (Bill To)">
//             <Input label="Client Name" placeholder="Buyer Corp Ltd" value={data.buyerName} onChange={e => set('buyerName', e.target.value)} />
//             <Textarea label="Address" rows={2} placeholder="456, Park Street, Mumbai, Maharashtra 400001" value={data.buyerAddress} onChange={e => set('buyerAddress', e.target.value)} />
//             <Input label="Client GSTIN" placeholder="27BBBBB0000B1Z5 (optional)" value={data.buyerGST} onChange={e => set('buyerGST', e.target.value)} />
//           </Section>

//           <Divider />

//           <Section title="Line Items">
//             <div className="space-y-2">
//               {data.items.map((item, i) => (
//                 <ItemRow
//                   key={item.id}
//                   item={item}
//                   index={i}
//                   onChange={updateItem}
//                   onRemove={removeItem}
//                   currency={data.currency}
//                   canRemove={data.items.length > 1}
//                 />
//               ))}
//             </div>
//             <button onClick={addItem} className="btn-secondary w-full text-xs mt-2 gap-1.5">
//               <Plus size={13} /> Add Item
//             </button>
//           </Section>

//           <Divider />

//           <Section title="Notes & Terms" defaultOpen={false}>
//             <Textarea label="Notes" rows={2} placeholder="Thank you for your business." value={data.notes} onChange={e => set('notes', e.target.value)} />
//             <Textarea label="Terms & Conditions" rows={2} value={data.termsAndConditions} onChange={e => set('termsAndConditions', e.target.value)} />
//           </Section>
//         </Card>
//       </div>

//       {/* ── Right: Preview ── */}
//       <div className="sticky top-20">
//         <div className="flex items-center justify-between mb-3 no-print">
//           <p className="text-xs font-medium text-ink-400 uppercase tracking-wider">Live Preview</p>
//           <div className="flex gap-2">
//             <button onClick={handlePrint} className="btn-ghost text-xs gap-1"><Printer size={11} /> Print</button>
//             <button onClick={handleDownload} disabled={downloading} className="btn-primary text-xs gap-1">
//               <Download size={11} /> {downloading ? '…' : 'PDF'}
//             </button>
//           </div>
//         </div>
//         <InvoicePreview data={data} />
//       </div>
//     </div>
//   )
// }

'use client'

import { useState, useCallback } from 'react'
import { Plus, Trash2, Download, Printer, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { Input, Select, Textarea, Card, Divider } from '@/components/ui'
import {
  InvoiceData, InvoiceItem,
  DEFAULT_INVOICE, CURRENCIES, GST_RATES,
  calcItem, calcTotals, formatCurrency, newItem, amountInWords
} from '@/lib/logic/invoice'

function InvoicePreview({ data }: { data: InvoiceData }) {
  const totals = calcTotals(data.items)
  const hasIGST = data.items.some(i => i.gstType === 'igst')
  const hasCGST = data.items.some(i => i.gstType === 'cgst_sgst')

  return (
    <div id="invoice-preview" className="bg-white text-slate-800 border-2 border-slate-900 overflow-hidden font-sans text-xs shadow-sm max-w-[210mm] mx-auto">
      {/* Title Header */}
      <div className="border-b-2 border-slate-900 p-2 text-center bg-slate-50">
        <h1 className="text-sm font-bold tracking-widest text-slate-900 uppercase">Tax Invoice</h1>
      </div>

      {/* Row 1: Seller & Invoice Details */}
      <div className="grid grid-cols-2 border-b-2 border-slate-900 divide-x-2 divide-slate-900">
        <div className="p-3 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seller</p>
          <p className="font-bold text-slate-900 text-sm">{data.sellerName || 'Your Business Name'}</p>
          <p className="text-slate-600 whitespace-pre-line">{data.sellerAddress || 'Seller Address Location'}</p>
          {data.sellerGST && <p className="font-medium text-slate-900 pt-1">GSTIN: <span className="font-mono">{data.sellerGST}</span></p>}
        </div>
        <div className="p-3 space-y-1.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice Details</p>
          <div className="grid grid-cols-3 gap-y-1 font-medium">
            <span className="text-slate-500">Invoice No</span>
            <span className="col-span-2 font-mono font-bold text-slate-900">: {data.invoiceNumber || '—'}</span>
            <span className="text-slate-500">Date</span>
            <span className="col-span-2">: {data.invoiceDate}</span>
            <span className="text-slate-500">Due Date</span>
            <span className="col-span-2">: {data.dueDate}</span>
            <span className="text-slate-500">Place</span>
            <span className="col-span-2">: {data.placeOfSupply}</span>
          </div>
        </div>
      </div>

      {/* Row 2: Bill To & Ship To */}
      <div className="grid grid-cols-2 border-b-2 border-slate-900 divide-x-2 divide-slate-900">
        <div className="p-3 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bill To</p>
          <p className="font-bold text-slate-900">{data.buyerName || 'Client Business Name'}</p>
          <p className="text-slate-600 whitespace-pre-line">{data.buyerAddress || 'Client Billing Address'}</p>
          {data.buyerGST && <p className="font-medium text-slate-900 pt-1">GSTIN: <span className="font-mono">{data.buyerGST}</span></p>}
        </div>
        <div className="p-3 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ship To</p>
          <p className="font-bold text-slate-900">{data.shipToName || data.buyerName || 'Same as Billing'}</p>
          <p className="text-slate-600 whitespace-pre-line">{data.shipToAddress || data.buyerAddress || 'Same as Delivery Location'}</p>
          {data.shipToGST && <p className="font-medium text-slate-900 pt-1">GSTIN: <span className="font-mono">{data.shipToGST || data.buyerGST}</span></p>}
        </div>
      </div>

      {/* Row 3: Main Line Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-b-2 border-slate-900 border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-900 divide-x-2 divide-slate-900 text-[11px] font-bold text-slate-900">
              <th className="p-2 text-center w-10">Sr#</th>
              <th className="p-2">Description of Goods</th>
              <th className="p-2 text-center w-16">HSN</th>
              <th className="p-2 text-center w-12">Qty</th>
              <th className="p-2 text-right w-24">Rate</th>
              <th className="p-2 text-right w-28">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.items.map((item, idx) => {
              const c = calcItem(item)
              return (
                <tr key={item.id} className="divide-x-2 divide-slate-900 text-slate-700">
                  <td className="p-2 text-center font-mono">{idx + 1}</td>
                  <td className="p-2 font-medium text-slate-900">{item.description || '—'}</td>
                  <td className="p-2 text-center font-mono text-slate-600">{item.hsn || '—'}</td>
                  <td className="p-2 text-center font-mono">{item.quantity}</td>
                  <td className="p-2 text-right font-mono">{formatCurrency(item.rate, data.currency)}</td>
                  <td className="p-2 text-right font-mono font-bold text-slate-900">{formatCurrency(c.subtotal, data.currency)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Row 4: Amount in Words & Financial Aggregated Totals */}
      <div className="grid grid-cols-2 border-b-2 border-slate-900 divide-x-2 divide-slate-900">
        <div className="p-3 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Amount Chargeable (in words)</p>
            <p className="font-medium text-slate-800 italic leading-relaxed">{amountInWords(totals.grandTotal)}</p>
          </div>
        </div>
        <div className="p-3 space-y-1.5 font-medium">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-mono">{formatCurrency(totals.subtotal, data.currency)}</span>
          </div>
          {hasCGST && (
            <>
              <div className="flex justify-between text-slate-600">
                <span>CGST Summary</span>
                <span className="font-mono">{formatCurrency(totals.totalCGST, data.currency)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SGST Summary</span>
                <span className="font-mono">{formatCurrency(totals.totalSGST, data.currency)}</span>
              </div>
            </>
          )}
          {hasIGST && (
            <div className="flex justify-between text-slate-600">
              <span>IGST Summary</span>
              <span className="font-mono">{formatCurrency(totals.totalIGST, data.currency)}</span>
            </div>
          )}
          <div className="border-t border-dashed border-slate-400 my-1"></div>
          <div className="flex justify-between text-slate-900 font-bold text-sm bg-slate-100 p-1 rounded">
            <span>TOTAL</span>
            <span className="font-mono text-emerald-700">{formatCurrency(totals.grandTotal, data.currency)}</span>
          </div>
        </div>
      </div>

      {/* Row 5: Detailed Tax Audit Breakup Table */}
      <div className="border-b-2 border-slate-900 bg-slate-50/30">
        <div className="p-1.5 bg-slate-50 border-b font-bold tracking-wider text-[10px] text-slate-500 uppercase">
          GST Breakup Matrix
        </div>
        <table className="w-full border-collapse text-left text-[10px]">
          <thead>
            <tr className="border-b border-slate-900 font-bold text-slate-700 divide-x divide-slate-900 bg-slate-100">
              <th className="p-1.5 text-center">HSN/SAC</th>
              <th className="p-1.5 text-right">Taxable Value</th>
              {hasCGST && <>
                <th className="p-1.5 text-right">CGST Amt</th>
              </>}
              {hasCGST && <>
                <th className="p-1.5 text-right">SGST Amt</th>
              </>}
              {hasIGST && <th className="p-1.5 text-right">IGST Amt</th>}
              <th className="p-1.5 text-right">Total Tax</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300 font-mono text-slate-600">
            {totals.hsnBreakup.map((row) => (
              <tr key={row.hsn} className="divide-x divide-slate-900">
                <td className="p-1.5 text-center font-bold text-slate-800">{row.hsn}</td>
                <td className="p-1.5 text-right">{formatCurrency(row.taxableValue, data.currency)}</td>
                {hasCGST && <td className="p-1.5 text-right">{formatCurrency(row.cgstAmount, data.currency)}</td>}
                {hasCGST && <td className="p-1.5 text-right">{formatCurrency(row.sgstAmount, data.currency)}</td>}
                {hasIGST && <td className="p-1.5 text-right">{formatCurrency(row.igstAmount, data.currency)}</td>}
                <td className="p-1.5 text-right font-bold text-slate-900">{formatCurrency(row.totalTax, data.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Row 6: Bank Information & Standard Declarations */}
      <div className="grid grid-cols-2 divide-x-2 divide-slate-900">
        <div className="p-3 space-y-0.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Bank Details</p>
          <p className="font-bold text-slate-900">Punjab National Bank</p>
          <p className="text-slate-600 font-mono">A/C: 12381131001919</p>
          <p className="text-slate-600 font-mono">IFSC: PUNB0517010</p>
        </div>
        <div className="p-3 flex flex-col justify-between items-end relative min-h-[72px]">
          <div className="w-full text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Declaration</p>
            <p className="text-slate-500 text-[10px] leading-tight">{data.termsAndConditions}</p>
          </div>
          <div className="text-right w-full border-t border-slate-300 pt-8 mt-4">
            <p className="font-bold text-slate-900 text-[10px] uppercase tracking-wide">For {data.sellerName || 'Your Business Name'}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Authorised Signatory</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ItemRow({
  item, index, onChange, onRemove, currency, canRemove,
}: {
  item: InvoiceItem
  index: number
  onChange: (id: string, field: keyof InvoiceItem, value: string | number) => void
  onRemove: (id: string) => void
  currency: string
  canRemove: boolean
}) {
  const c = calcItem(item)
  return (
    <div className="grid gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">Line Item {index + 1}</span>
        {canRemove && (
          <button onClick={() => onRemove(item.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <Input
            placeholder="Description of goods"
            value={item.description}
            onChange={e => onChange(item.id, 'description', e.target.value)}
          />
        </div>
        <Input
          placeholder="HSN/SAC"
          value={item.hsn}
          onChange={e => onChange(item.id, 'hsn', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Input
          label="Qty"
          type="number" min="1"
          value={item.quantity}
          onChange={e => onChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
        />
        <Input
          label="Rate"
          type="number" min="0" step="0.01"
          value={item.rate}
          onChange={e => onChange(item.id, 'rate', parseFloat(e.target.value) || 0)}
        />
        <Select
          label="GST Rate"
          value={item.gstRate}
          options={GST_RATES.map(r => ({ value: String(r), label: `${r}%` }))}
          onChange={e => onChange(item.id, 'gstRate', parseInt(e.target.value))}
        />
        <Select
          label="Tax Type"
          value={item.gstType}
          options={[
            { value: 'none',      label: 'Exempt' },
            { value: 'cgst_sgst', label: 'CGST + SGST' },
            { value: 'igst',      label: 'IGST' },
          ]}
          onChange={e => onChange(item.id, 'gstType', e.target.value)}
        />
      </div>
    </div>
  )
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between font-bold text-xs uppercase tracking-wider text-slate-700"
      >
        <span>{title}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="space-y-3 pt-3">{children}</div>}
    </div>
  )
}

export function InvoiceGenerator() {
  const [data, setData] = useState<InvoiceData>(DEFAULT_INVOICE)
  const [downloading, setDownloading] = useState(false)

  const set = useCallback(<K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => {
    setData(prev => ({ ...prev, [field]: value }))
  }, [])

  const updateItem = useCallback((id: string, field: keyof InvoiceItem, value: string | number) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item),
    }))
  }, [])

  const addItem = () => setData(prev => ({ ...prev, items: [...prev.items, newItem()] }))
  const removeItem = (id: string) => setData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }))
  const resetInvoice = () => setData({ ...DEFAULT_INVOICE })
  const handlePrint = () => window.print()

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const { downloadInvoicePDF } = await import('@/lib/logic/pdf')
      await downloadInvoicePDF(data)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start p-4 max-w-7xl mx-auto">
      {/* Forms Management Section */}
      <div className="xl:col-span-2 space-y-4 no-print">
        <div className="flex gap-2 justify-between items-center bg-slate-900 text-white p-3 rounded-xl">
          <h2 className="font-bold text-sm">LedgerHQ Engine</h2>
          <div className="flex gap-1.5">
            <button onClick={resetInvoice} className="p-1.5 hover:bg-slate-800 rounded"><RefreshCw size={14} /></button>
            <button onClick={handlePrint} className="bg-slate-800 text-xs px-2.5 py-1.5 font-medium rounded hover:bg-slate-700">Print</button>
            <button onClick={handleDownload} disabled={downloading} className="bg-emerald-600 text-xs px-3 py-1.5 font-bold rounded hover:bg-emerald-500 disabled:opacity-50">
              {downloading ? 'Compiling...' : 'Get PDF'}
            </button>
          </div>
        </div>

        <Section title="1. Metadata Core">
          <div className="grid grid-cols-2 gap-2">
            <Input label="Invoice Number" value={data.invoiceNumber} onChange={e => set('invoiceNumber', e.target.value)} />
            <Input label="Place of Supply" value={data.placeOfSupply} onChange={e => set('placeOfSupply', e.target.value)} />
            <Input label="Invoice Date" type="date" value={data.invoiceDate} onChange={e => set('invoiceDate', e.target.value)} />
            <Input label="Due Date" type="date" value={data.dueDate} onChange={e => set('dueDate', e.target.value)} />
          </div>
        </Section>

        <Section title="2. Parties (Seller)">
          <Input label="Legal Name" value={data.sellerName} onChange={e => set('sellerName', e.target.value)} />
          <Textarea label="Full Address" rows={2} value={data.sellerAddress} onChange={e => set('sellerAddress', e.target.value)} />
          <Input label="Seller GSTIN" value={data.sellerGST} onChange={e => set('sellerGST', e.target.value)} />
        </Section>

        <Section title="3. Consignee Map (Bill To / Ship To)">
          <div className="bg-slate-50 p-2 rounded-lg space-y-2 border">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Billing profile</p>
            <Input label="Buyer Client Name" value={data.buyerName} onChange={e => set('buyerName', e.target.value)} />
            <Textarea label="Billing Address" rows={2} value={data.buyerAddress} onChange={e => set('buyerAddress', e.target.value)} />
            <Input label="Buyer GSTIN" value={data.buyerGST} onChange={e => set('buyerGST', e.target.value)} />
          </div>
          <div className="bg-slate-50 p-2 rounded-lg space-y-2 border">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Shipping profile (Optional)</p>
            <Input label="Shipping Name" placeholder="Leave empty if identical" value={data.shipToName} onChange={e => set('shipToName', e.target.value)} />
            <Textarea label="Shipping Address" rows={2} value={data.shipToAddress} onChange={e => set('shipToAddress', e.target.value)} />
            <Input label="Shipping GSTIN" value={data.shipToGST} onChange={e => set('shipToGST', e.target.value)} />
          </div>
        </Section>

        <Section title="4. Line Material Items">
          <div className="space-y-2">
            {data.items.map((item, idx) => (
              <ItemRow
                key={item.id}
                item={item}
                index={idx}
                onChange={updateItem}
                onRemove={removeItem}
                currency={data.currency}
                canRemove={data.items.length > 1}
              />
            ))}
          </div>
          <button onClick={addItem} className="w-full py-2 bg-slate-100 hover:bg-slate-200 border-2 border-dashed border-slate-300 font-bold text-xs text-slate-700 rounded-xl mt-2 flex items-center justify-center gap-1">
            <Plus size={14} /> Add New Row
          </button>
        </Section>
      </div>

      {/* Structured Preview Workspace Block */}
      <div className="xl:col-span-3 sticky top-6">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 no-print">Structured View Workspace</p>
        <InvoicePreview data={data} />
      </div>
    </div>
  )
}