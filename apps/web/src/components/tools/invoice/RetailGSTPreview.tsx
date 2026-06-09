

// // // import { useState, useCallback, useEffect } from 'react'
// // // import { Plus, Trash2, RefreshCw, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, FileDown } from 'lucide-react'
// // // import { Input, Select, Textarea } from '@/components/ui'
// // import {
// //   InvoiceData, InvoiceItem, CurrencyCode,
// //   DEFAULT_INVOICE, CURRENCIES, GST_RATES, CESS_RATES, INDIAN_STATES,
// //   calcRetailItem, calcRetailTotals, formatCurrency, newItem, amountInWords,
// //   validateInvoiceNumber, extractPANFromGST, computeOffsetDueDate, computeRetailEffectiveRate,
// //   validatePAN,
// // } from '@/lib/logic/invoice'

// // // import html2canvas from 'html2canvas'
// // // import { jsPDF } from 'jspdf'



// // // ─────────────────────────────────────────────────────────────────────────────
// // // INVOICE PREVIEW (unchanged from current)
// // // ─────────────────────────────────────────────────────────────────────────────
// // export default function RetailGSTPreview({ data }: { data: InvoiceData }) {
// //   const totals  = calcRetailTotals(data.items)
// //   const hasIGST = data.items.some(i => i.gstType === 'igst')
// //   const hasCGST = data.items.some(i => i.gstType === 'cgst_sgst')
// //   const hasCess = data.items.some(i => i.cessRate > 0)
// //   const formattedPOS  = INDIAN_STATES.find(s => s.value === data.placeOfSupply)?.label || data.placeOfSupply
// //   const isInvNumValid = validateInvoiceNumber(data.invoiceNumber)

// //   return (
// //     <div id="invoice-preview" className="bg-white text-slate-800 border-2 border-slate-900 overflow-hidden font-sans text-xs shadow-sm max-w-[210mm] mx-auto p-1">
// //       <div className="border-b-2 border-slate-900 p-2 text-center bg-slate-50">
// //         <h1 className="text-sm font-bold tracking-widest text-slate-900 uppercase">Tax Invoice</h1>
// //       </div>
// //       <div className="grid grid-cols-2 border-b-2 border-slate-900 divide-x-2 divide-slate-900">
// //         <div className="p-3 space-y-1">
// //           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seller</p>
// //           <p className="font-bold text-slate-900 text-sm">{data.sellerName || 'Your Business Name'}</p>
// //           <p className="text-slate-600 whitespace-pre-line">{data.sellerAddress || 'Seller Address Location'}{data.sellerLandmark && `\nLandmark: ${data.sellerLandmark}`}</p>
// //           {data.sellerGST && <p className="font-medium text-slate-900 pt-0.5">GSTIN: <span className="font-mono">{data.sellerGST}</span></p>}
// //           {data.sellerPAN && <p className="text-slate-500 font-mono text-[10px]">PAN: {data.sellerPAN}</p>}
// //         </div>
// //         <div className="p-3 space-y-1.5">
// //           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice Details</p>
// //           <div className="grid grid-cols-3 gap-y-1 font-medium">
// //             <span className="text-slate-500">Invoice No</span>
// //             <span className={`col-span-2 font-mono font-bold ${isInvNumValid ? 'text-slate-900' : 'text-red-600 bg-red-50 px-1 rounded'}`}>: {data.invoiceNumber || '—'} {!isInvNumValid && data.invoiceNumber && '(!)'}</span>
// //             <span className="text-slate-500">Date</span><span className="col-span-2">: {data.invoiceDate}</span>
// //             <span className="text-slate-500">Due Date</span><span className="col-span-2">: {data.dueDate}</span>
// //             <span className="text-slate-500">Place of Supply</span><span className="col-span-2">: {formattedPOS}</span>
// //           </div>
// //         </div>
// //       </div>
// //       <div className="grid grid-cols-2 border-b-2 border-slate-900 divide-x-2 divide-slate-900">
// //         <div className="p-3 space-y-1">
// //           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bill To</p>
// //           <p className="font-bold text-slate-900">{data.buyerName || 'Client Business Name'}</p>
// //           <p className="text-slate-600 whitespace-pre-line">{data.buyerAddress || 'Client Billing Address'}{data.buyerLandmark && `\nLandmark: ${data.buyerLandmark}`}</p>
// //           {data.buyerGST && <p className="font-medium text-slate-900 pt-0.5">GSTIN: <span className="font-mono">{data.buyerGST}</span></p>}
// //           {data.buyerPAN && <p className="text-slate-500 font-mono text-[10px]">PAN: {data.buyerPAN}</p>}
// //         </div>
// //         <div className="p-3 space-y-1">
// //           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ship To</p>
// //           <p className="font-bold text-slate-900">{data.shipToName || data.buyerName || 'Same as Billing'}</p>
// //           <p className="text-slate-600 whitespace-pre-line">{data.shipToAddress || data.buyerAddress || 'Same as Delivery Location'}{data.shipToLandmark && `\nLandmark: ${data.shipToLandmark}`}</p>
// //           <p className="font-medium text-slate-900 pt-0.5">GSTIN: <span className="font-mono">{data.shipToGST || data.buyerGST || '—'}</span></p>
// //         </div>
// //       </div>
// //       <div className="overflow-x-auto">
// //         <table className="w-full border-b-2 border-slate-900 border-collapse text-left">
// //           <thead>
// //             <tr className="bg-slate-50 border-b-2 border-slate-900 text-[10px] font-bold text-slate-900">
// //               <th className="p-1.5 text-center border-r border-slate-400 w-8">S.No.</th>
// //               <th className="p-1.5 border-r border-slate-400">Item Name</th>
// //               <th className="p-1.5 text-center border-r border-slate-400 w-20">HSN Code</th>
// //               <th className="p-1.5 text-center border-r border-slate-400 w-14">Qty</th>
// //               <th className="p-1.5 text-right border-r border-slate-400 w-20">MRP</th>
// //               <th className="p-1.5 text-right border-r border-slate-400 w-20">Rate</th>
// //               <th className="p-1.5 text-right border-r border-slate-400 w-14">Disc %</th>
// //               <th className="p-1.5 text-right border-r border-slate-400 w-14">CD %</th>
// //               <th className="p-1.5 text-right border-r border-slate-400 w-14">GST%</th>
// //               {hasCess && <th className="p-1.5 text-right border-r border-slate-400 w-14">Cess %</th>}
// //               <th className="p-1.5 text-right border-r border-slate-400 w-20">GST Amt</th>
// //               <th className="p-1.5 text-right w-24">Amount</th>
// //             </tr>
// //           </thead>
// //           <tbody className="divide-y divide-slate-200">
// //             {data.items.map((item, idx) => {
// //               const c = calcRetailItem(item)
// //               return (
// //                 <tr key={item.id} className="text-slate-700 text-[10px]">
// //                   <td className="p-1.5 text-center font-mono border-r border-slate-300">{idx + 1}</td>
// //                   <td className="p-1.5 font-medium text-slate-900 border-r border-slate-300">{item.description || '—'}</td>
// //                   <td className="p-1.5 text-center font-mono text-slate-600 border-r border-slate-300">{item.hsn || '—'}</td>
// //                   <td className="p-1.5 text-center font-mono border-r border-slate-300">{item.quantity}</td>
// //                   <td className="p-1.5 text-right font-mono border-r border-slate-300">{formatCurrency(item.mrp, data.currency)}</td>
// //                   <td className="p-1.5 text-right font-mono border-r border-slate-300">{formatCurrency(c.effectiveRate, data.currency)}</td>
// //                   <td className="p-1.5 text-right font-mono border-r border-slate-300">{item.discRate.toFixed(2)}%</td>
// //                   <td className="p-1.5 text-right font-mono border-r border-slate-300">{item.cdRate.toFixed(2)}%</td>
// //                   <td className="p-1.5 text-right font-mono border-r border-slate-300">{item.gstRate}%</td>
// //                   {hasCess && <td className="p-1.5 text-right font-mono border-r border-slate-300">{item.cessRate}%</td>}
// //                   <td className="p-1.5 text-right font-mono border-r border-slate-300">{formatCurrency(c.gstAmt, data.currency)}</td>
// //                   <td className="p-1.5 text-right font-mono font-bold text-slate-900">{formatCurrency(c.subtotal, data.currency)}</td>
// //                 </tr>
// //               )
// //             })}
// //             <tr className="bg-slate-50 font-bold text-[10px] border-t-2 border-slate-900">
// //               <td className="p-1.5 border-r border-slate-300" /><td className="p-1.5 text-center text-slate-700 border-r border-slate-300">Totals</td>
// //               <td className="p-1.5 border-r border-slate-300" />
// //               <td className="p-1.5 text-center font-mono border-r border-slate-300">{data.items.reduce((s, i) => s + i.quantity, 0)} Units</td>
// //               <td className="p-1.5 border-r border-slate-300" /><td className="p-1.5 border-r border-slate-300" />
// //               <td className="p-1.5 text-right font-mono border-r border-slate-300">{totals.totalDisc.toFixed(2)}</td>
// //               <td className="p-1.5 text-right font-mono border-r border-slate-300">{totals.totalCD.toFixed(2)}</td>
// //               <td className="p-1.5 border-r border-slate-300" />
// //               {hasCess && <td className="p-1.5 border-r border-slate-300" />}
// //               <td className="p-1.5 text-right font-mono border-r border-slate-300">{formatCurrency(totals.totalGST, data.currency)}</td>
// //               <td className="p-1.5 text-right font-mono text-slate-900">{formatCurrency(totals.subtotal, data.currency)}</td>
// //             </tr>
// //           </tbody>
// //         </table>
// //       </div>
// //       <div className="grid grid-cols-2 border-b-2 border-slate-900 divide-x-2 divide-slate-900">
// //         <div className="p-3 flex flex-col justify-between space-y-4">
// //           <div>
// //             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tax Amount Chargeable (in words)</p>
// //             <p className="font-medium text-blue-900 italic leading-relaxed">{amountInWords(totals.totalGST + totals.totalCess, data.currency)}</p>
// //           </div>
// //           <div>
// //             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Grand Amount (in words)</p>
// //             <p className="font-medium text-slate-800 italic leading-relaxed">{amountInWords(totals.grandTotal, data.currency)}</p>
// //           </div>
// //         </div>
// //         <div className="p-3 space-y-1.5 font-medium">
// //           <div className="flex justify-between text-slate-600"><span>Subtotal (Taxable)</span><span className="font-mono">{formatCurrency(totals.subtotal, data.currency)}</span></div>
// //           {totals.totalDisc > 0 && <div className="flex justify-between text-slate-500 text-[10px]"><span>Trade Discount</span><span className="font-mono">- {formatCurrency(totals.totalDisc, data.currency)}</span></div>}
// //           {totals.totalCD > 0 && <div className="flex justify-between text-slate-500 text-[10px]"><span>Cash Discount (CD)</span><span className="font-mono">- {formatCurrency(totals.totalCD, data.currency)}</span></div>}
// //           {hasCGST && <><div className="flex justify-between text-slate-600"><span>CGST</span><span className="font-mono">{formatCurrency(totals.totalCGST, data.currency)}</span></div><div className="flex justify-between text-slate-600"><span>SGST</span><span className="font-mono">{formatCurrency(totals.totalSGST, data.currency)}</span></div></>}
// //           {hasIGST && <div className="flex justify-between text-slate-600"><span>IGST</span><span className="font-mono">{formatCurrency(totals.totalIGST, data.currency)}</span></div>}
// //           {totals.totalCess > 0 && <div className="flex justify-between text-slate-600"><span>Total Cess</span><span className="font-mono">{formatCurrency(totals.totalCess, data.currency)}</span></div>}
// //           <div className="border-t border-dashed border-slate-400 my-1" />
// //           <div className="flex justify-between text-slate-600 font-medium"><span>Gross Amount</span><span className="font-mono">{formatCurrency(totals.grandTotal, data.currency)}</span></div>
// //           <div className="flex justify-between text-slate-900 font-bold text-sm bg-slate-100 p-1 rounded"><span>Net Amount (Rounded Off)</span><span className="font-mono text-emerald-700">{formatCurrency(Math.round(totals.grandTotal), data.currency)}</span></div>
// //         </div>
// //       </div>
// //       <div className="border-b-2 border-slate-900 bg-slate-50/30">
// //         <div className="p-1.5 bg-slate-50 border-b font-bold tracking-wider text-[10px] text-slate-500 uppercase">GST Breakup Matrix</div>
// //         <table className="w-full border-collapse text-left text-[10px]">
// //           <thead><tr className="border-b border-slate-900 font-bold text-slate-700 divide-x divide-slate-900 bg-slate-100">
// //             <th className="p-1.5 text-center">HSN/SAC</th><th className="p-1.5 text-right">Taxable Value</th>
// //             {hasCGST && <><th className="p-1.5 text-right">CGST Amt</th><th className="p-1.5 text-right">SGST Amt</th></>}
// //             {hasIGST && <th className="p-1.5 text-right">IGST Amt</th>}
// //             {hasCess && <th className="p-1.5 text-right">Cess Amt</th>}
// //             <th className="p-1.5 text-right">Total Tax</th>
// //           </tr></thead>
// //           <tbody className="divide-y divide-slate-300 font-mono text-slate-600">
// //             {totals.hsnBreakup.map(row => (
// //               <tr key={row.hsn} className="divide-x divide-slate-900">
// //                 <td className="p-1.5 text-center font-bold text-slate-800">{row.hsn}</td>
// //                 <td className="p-1.5 text-right">{formatCurrency(row.taxableValue, data.currency)}</td>
// //                 {hasCGST && <><td className="p-1.5 text-right">{formatCurrency(row.cgstAmount, data.currency)}</td><td className="p-1.5 text-right">{formatCurrency(row.sgstAmount, data.currency)}</td></>}
// //                 {hasIGST && <td className="p-1.5 text-right">{formatCurrency(row.igstAmount, data.currency)}</td>}
// //                 {hasCess && <td className="p-1.5 text-right">{formatCurrency(row.cessAmount, data.currency)}</td>}
// //                 <td className="p-1.5 text-right font-bold text-slate-900">{formatCurrency(row.totalTax, data.currency)}</td>
// //               </tr>
// //             ))}
// //           </tbody>
// //         </table>
// //       </div>
// //       <div className="grid grid-cols-2 divide-x-2 divide-slate-900">
// //         <div className="p-3 space-y-0.5">
// //           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Bank Details</p>
// //           <p className="font-bold text-slate-900">Punjab National Bank</p>
// //           <p className="text-slate-600 font-mono">A/C: 12381131001919</p>
// //           <p className="text-slate-600 font-mono">IFSC: PUNB0517010</p>
// //         </div>
// //         <div className="p-3 flex flex-col justify-between items-end relative min-h-[72px]">
// //           <div className="w-full text-left">
// //             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Declaration</p>
// //             <p className="text-slate-500 text-[10px] leading-tight">{data.termsAndConditions}</p>
// //           </div>
// //           <div className="text-right w-full border-t border-slate-300 pt-8 mt-4">
// //             <p className="font-bold text-slate-900 text-[10px] uppercase tracking-wide">For {data.sellerName || 'Your Business Name'}</p>
// //             <p className="text-[9px] text-slate-400 mt-0.5">Authorised Signatory</p>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   )
// // }

// // import { useState, useCallback, useEffect } from 'react'
// // import { Plus, Trash2, RefreshCw, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, FileDown } from 'lucide-react'
// // import { Input, Select, Textarea } from '@/components/ui'
// import {
//   InvoiceData, InvoiceItem, CurrencyCode,
//   DEFAULT_INVOICE, CURRENCIES, GST_RATES, CESS_RATES, INDIAN_STATES,
//   calcRetailItem, calcRetailTotals, formatCurrency, newItem, amountInWords,
//   validateInvoiceNumber, extractPANFromGST, computeOffsetDueDate, computeRetailEffectiveRate,
//   validatePAN,
// } from '@/lib/logic/invoice'

// // import html2canvas from 'html2canvas'
// // import { jsPDF } from 'jspdf'



// // ─────────────────────────────────────────────────────────────────────────────
// // INVOICE PREVIEW (Optimized space matching Screenshot 2026-06-06 at 4.48.28 PM.jpg)
// // ─────────────────────────────────────────────────────────────────────────────
// export default function RetailGSTPreview({ data }: { data: InvoiceData }) {
//   const totals  = calcRetailTotals(data.items)
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

//       {/* ─────────────────────────────────────────────────────────────────────────
//           EFFICIENT HIGH-DENSITY ITEM TABLE
//           ───────────────────────────────────────────────────────────────────────── */}
//       <div className="overflow-x-auto">
//         <table className="w-full border-b-2 border-slate-900 border-collapse text-left table-fixed">
//           <thead>
//             <tr className="bg-slate-50 border-b-2 border-slate-900 text-[10px] font-bold text-slate-900">
//               <th className="p-1 text-center border-r border-slate-900 w-[5%]">SNo.</th>
//               <th className="p-1 border-r border-slate-900 w-[28%]">Item Name</th>
//               <th className="p-1 text-center border-r border-slate-900 w-[10%]">HSN Code</th>
//               <th className="p-1 text-center border-r border-slate-900 w-[7%]">Qty</th>
//               <th className="p-1 text-right border-r border-slate-900 w-[8%]">MRP</th>
//               <th className="p-1 text-right border-r border-slate-900 w-[8%]">Rate</th>
//               <th className="p-1 text-right border-r border-slate-900 w-[6%]">Disc %</th>
//               <th className="p-1 text-right border-r border-slate-900 w-[6%]">CD %</th>
//               <th className="p-1 text-right border-r border-slate-900 w-[6%]">GST%</th>
//               {hasCess && <th className="p-1 text-right border-r border-slate-900 w-[6%]">Cess %</th>}
//               <th className="p-1 text-right border-r border-slate-900 w-[8%]">Gst Amt</th>
//               <th className="p-1 text-right w-[10%]">Amount</th>
//             </tr>
//           </thead>
//           <tbody>
//             {/* Active Items */}
//             {data.items.map((item, idx) => {
//               const c = calcRetailItem(item)
//               return (
//                 <tr key={item.id} className="text-slate-800 text-[10px] tracking-tight align-top">
//                   <td className="py-0.5 px-1 text-center font-mono border-r border-slate-900">{idx + 1}</td>
//                   <td className="py-0.5 px-1 font-medium text-slate-900 border-r border-slate-900 break-words leading-tight">{item.description || '—'}</td>
//                   <td className="py-0.5 px-1 text-center font-mono text-slate-600 border-r border-slate-900">{item.hsn || '—'}</td>
//                   <td className="py-0.5 px-1 text-center font-mono border-r border-slate-900">{item.quantity} PCS</td>
//                   <td className="py-0.5 px-1 text-right font-mono border-r border-slate-900">{item.mrp.toFixed(2)}</td>
//                   <td className="py-0.5 px-1 text-right font-mono border-r border-slate-900">{c.effectiveRate.toFixed(2)}</td>
//                   <td className="py-0.5 px-1 text-right font-mono border-r border-slate-900">{item.discRate > 0 ? `${item.discRate.toFixed(2)}%` : '0.00%'}</td>
//                   <td className="py-0.5 px-1 text-right font-mono border-r border-slate-900">{item.cdRate > 0 ? `${item.cdRate.toFixed(2)}%` : '0.00%'}</td>
//                   <td className="py-0.5 px-1 text-right font-mono border-r border-slate-900">{item.gstRate.toFixed(2)}</td>
//                   {hasCess && <td className="py-0.5 px-1 text-right font-mono border-r border-slate-900">{item.cessRate.toFixed(2)}%</td>}
//                   <td className="py-0.5 px-1 text-right font-mono border-r border-slate-900">{c.gstAmt.toFixed(2)}</td>
//                   <td className="py-0.5 px-1 text-right font-mono font-medium text-slate-900">{c.subtotal.toFixed(2)}</td>
//                 </tr>
//               )
//             })}

//             {/* Visual Extension Filler Block to emulate the empty vertical grid spacing from the physical print */}
//             <tr className="h-24 align-top select-none pointer-events-none text-[0px]">
//               <td className="border-r border-slate-900">&nbsp;</td>
//               <td className="border-r border-slate-900">&nbsp;</td>
//               <td className="border-r border-slate-900">&nbsp;</td>
//               <td className="border-r border-slate-900">&nbsp;</td>
//               <td className="border-r border-slate-900">&nbsp;</td>
//               <td className="border-r border-slate-900">&nbsp;</td>
//               <td className="border-r border-slate-900">&nbsp;</td>
//               <td className="border-r border-slate-900">&nbsp;</td>
//               <td className="border-r border-slate-900">&nbsp;</td>
//               {hasCess && <td className="border-r border-slate-900">&nbsp;</td>}
//               <td className="border-r border-slate-900">&nbsp;</td>
//               <td>&nbsp;</td>
//             </tr>

//             {/* Totals Summary Row matching item alignments */}
//             <tr className="bg-slate-50/60 font-bold text-[10px] border-t-2 border-slate-900 align-middle">
//               <td className="p-1 border-r border-slate-900" />
//               <td className="p-1 text-center text-slate-900 uppercase tracking-wider border-r border-slate-900">Totals</td>
//               <td className="p-1 border-r border-slate-900" />
//               <td className="p-1 text-center font-mono border-r border-slate-900 text-[9px] whitespace-nowrap">{data.items.reduce((s, i) => s + i.quantity, 0)} Units</td>
//               <td className="p-1 border-r border-slate-900" />
//               <td className="p-1 border-r border-slate-900" />
//               <td className="p-1 text-right font-mono border-r border-slate-900">{totals.totalDisc.toFixed(2)}</td>
//               <td className="p-1 text-right font-mono border-r border-slate-900">{totals.totalCD.toFixed(2)}</td>
//               <td className="p-1 border-r border-slate-900" />
//               {hasCess && <td className="p-1 border-r border-slate-900" />}
//               <td className="p-1 text-right font-mono border-r border-slate-900">{totals.totalGST.toFixed(2)}</td>
//               <td className="p-1 text-right font-mono text-slate-900">{totals.subtotal.toFixed(2)}</td>
//             </tr>
//           </tbody>
//         </table>
//       </div>

//       <div className="grid grid-cols-2 border-b-2 border-slate-900 divide-x-2 divide-slate-900">
//         <div className="p-3 flex flex-col justify-between space-y-4">
//           <div>
//             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tax Amount Chargeable (in words)</p>
//             <p className="font-medium text-blue-900 italic leading-relaxed">{amountInWords(totals.totalGST + totals.totalCess, data.currency)}</p>
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




// import { useState, useCallback, useEffect } from 'react'
// import { Plus, Trash2, RefreshCw, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, FileDown } from 'lucide-react'
// import { Input, Select, Textarea } from '@/components/ui'
import {
  InvoiceData, InvoiceItem, CurrencyCode,
  DEFAULT_INVOICE, CURRENCIES, GST_RATES, CESS_RATES, INDIAN_STATES,
  calcRetailItem, calcRetailTotals, formatCurrency, newItem, amountInWords,
  validateInvoiceNumber, extractPANFromGST, computeOffsetDueDate, computeRetailEffectiveRate,
  validatePAN,
} from '@/lib/logic/invoice'

// import html2canvas from 'html2canvas'
// import { jsPDF } from 'jspdf'



// ─────────────────────────────────────────────────────────────────────────────
// INVOICE PREVIEW (Optimized space matching Screenshot 2026-06-06 at 4.48.28 PM.jpg)
// ─────────────────────────────────────────────────────────────────────────────
export default function RetailGSTPreview({ data }: { data: InvoiceData }) {
  const totals  = calcRetailTotals(data.items)
  const hasIGST = data.items.some(i => i.gstType === 'igst')
  const hasCGST = data.items.some(i => i.gstType === 'cgst_sgst')
  const hasCess = data.items.some(i => i.cessRate > 0)
  const formattedPOS  = INDIAN_STATES.find(s => s.value === data.placeOfSupply)?.label || data.placeOfSupply
  const isInvNumValid = validateInvoiceNumber(data.invoiceNumber)

  return (
    <div id="invoice-preview" className="bg-white text-slate-800 border-2 border-slate-900 overflow-hidden font-sans text-xs shadow-sm max-w-[210mm] mx-auto">
      <div className="border-b-2 border-slate-900 p-2 text-center bg-slate-50">
        <h1 className="text-sm font-bold tracking-widest text-slate-900 uppercase">{data.isProforma ? 'Proforma Invoice' : 'Tax Invoice'}</h1>
      </div>
      <div className="grid grid-cols-2 border-b-2 border-slate-900 divide-x-2 divide-slate-900">
        <div className="p-3">
          <div className="flex gap-3 items-start">
            {data.sellerLogo && (
              <img src={data.sellerLogo} alt="Logo" className="h-14 w-auto max-w-[80px] object-contain flex-shrink-0" />
            )}
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seller</p>
              <p className="font-bold text-slate-900 text-sm">{data.sellerName || 'Your Business Name'}</p>
              <p className="text-slate-600 whitespace-pre-line">{data.sellerAddress || 'Seller Address Location'}{data.sellerLandmark && `\nLandmark: ${data.sellerLandmark}`}</p>
              {data.sellerGST && <p className="font-medium text-slate-900 pt-0.5">GSTIN: <span className="font-mono">{data.sellerGST}</span></p>}
              {data.sellerPAN && <p className="text-slate-500 font-mono text-[10px]">PAN: {data.sellerPAN}</p>}
            </div>
          </div>
        </div>
        <div className="p-3 space-y-1.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice Details</p>
          <div className="grid grid-cols-3 gap-y-1 font-medium">
            <span className="text-slate-500">Invoice No</span>
            <span className={`col-span-2 font-mono font-bold ${isInvNumValid ? 'text-slate-900' : 'text-red-600 bg-red-50 px-1 rounded'}`}>: {data.invoiceNumber || '—'} {!isInvNumValid && data.invoiceNumber && '(!)'}</span>
            <span className="text-slate-500">Date</span><span className="col-span-2">: {data.invoiceDate}</span>
            <span className="text-slate-500">Due Date</span><span className="col-span-2">: {data.dueDate}</span>
            <span className="text-slate-500">Place of Supply</span><span className="col-span-2">: {formattedPOS}</span>
            <span className="text-slate-500">Reverse Charge</span>
            <span className={`col-span-2 ${data.reverseCharge ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>: {data.reverseCharge ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 border-b-2 border-slate-900 divide-x-2 divide-slate-900">
        <div className="p-3 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bill To</p>
          <p className="font-bold text-slate-900">{data.buyerName || 'Client Business Name'}</p>
          <p className="text-slate-600 whitespace-pre-line">{data.buyerAddress || 'Client Billing Address'}{data.buyerLandmark && `\nLandmark: ${data.buyerLandmark}`}</p>
          {data.buyerGST && <p className="font-medium text-slate-900 pt-0.5">GSTIN: <span className="font-mono">{data.buyerGST}</span></p>}
          {data.buyerPAN && <p className="text-slate-500 font-mono text-[10px]">PAN: {data.buyerPAN}</p>}
        </div>
        <div className="p-3 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ship To</p>
          <p className="font-bold text-slate-900">{data.shipToName || data.buyerName || 'Same as Billing'}</p>
          <p className="text-slate-600 whitespace-pre-line">{data.shipToAddress || data.buyerAddress || 'Same as Delivery Location'}{data.shipToLandmark && `\nLandmark: ${data.shipToLandmark}`}</p>
          <p className="font-medium text-slate-900 pt-0.5">GSTIN: <span className="font-mono">{data.shipToGST || data.buyerGST || '—'}</span></p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          EFFICIENT HIGH-DENSITY ITEM TABLE (REBALANCED FOR LARGE DIGIT OVERFLOWS)
          ───────────────────────────────────────────────────────────────────────── */}
      <div className="border-b-2 border-slate-900">
        <table className="w-full border-collapse text-left table-fixed">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-900 text-[9px] font-bold text-slate-900 tracking-tight">
              <th className="p-1 text-center border-r border-slate-900 w-[4%]">SNo.</th>
              <th className="p-1 border-r border-slate-900 w-[20%]">Item Name</th>
              <th className="p-1 text-center border-r border-slate-900 w-[8%]">HSN Code</th>
              <th className="p-1 text-center border-r border-slate-900 w-[6%]">Qty</th>
              <th className="p-1 text-right border-r border-slate-900 w-[10%]">MRP</th>
              <th className="p-1 text-right border-r border-slate-900 w-[10%]">Rate</th>
              <th className="p-1 text-right border-r border-slate-900 w-[5%]">Disc %</th>
              <th className="p-1 text-right border-r border-slate-900 w-[5%]">CD %</th>
              <th className="p-1 text-right border-r border-slate-900 w-[5%]">GST%</th>
              {hasCess && <th className="p-1 text-right border-r border-slate-900 w-[5%]">Cess %</th>}
              <th className="p-1 text-right border-r border-slate-900 w-[11%]">Gst Amt</th>
              <th className="p-1 text-right w-[11%]">Amount</th>
            </tr>
          </thead>
          <tbody>
            {/* Active Items */}
            {data.items.map((item, idx) => {
              const c = calcRetailItem(item)
              return (
                <tr key={item.id} className="text-slate-800 text-[10px] tracking-tighter align-top">
                  <td className="py-1 px-0.5 text-center font-mono border-r border-slate-900">{idx + 1}</td>
                  <td className="py-1 px-1 font-medium text-slate-900 border-r border-slate-900 break-words leading-tight">{item.description || '—'}</td>
                  <td className="py-1 px-0.5 text-center font-mono text-slate-600 border-r border-slate-900 break-all">{item.hsn || '—'}</td>
                  <td className="py-1 px-0.5 text-center font-mono border-r border-slate-900 break-all">{item.quantity} PCS</td>
                  <td className="py-1 px-0.5 text-right font-mono border-r border-slate-900 break-all">{item.mrp.toFixed(2)}</td>
                  <td className="py-1 px-0.5 text-right font-mono border-r border-slate-900 break-all">{c.effectiveRate.toFixed(2)}</td>
                  <td className="py-1 px-0.5 text-right font-mono border-r border-slate-900 whitespace-nowrap">{item.discRate > 0 ? `${item.discRate.toFixed(2)}%` : '0.00%'}</td>
                  <td className="py-1 px-0.5 text-right font-mono border-r border-slate-900 whitespace-nowrap">{item.cdRate > 0 ? `${item.cdRate.toFixed(2)}%` : '0.00%'}</td>
                  <td className="py-1 px-0.5 text-right font-mono border-r border-slate-900 whitespace-nowrap">{item.gstRate.toFixed(2)}</td>
                  {hasCess && <td className="py-1 px-0.5 text-right font-mono border-r border-slate-900 whitespace-nowrap">{item.cessRate.toFixed(2)}%</td>}
                  <td className="py-1 px-0.5 text-right font-mono border-r border-slate-900 break-all">{c.gstAmt.toFixed(2)}</td>
                  <td className="py-1 px-0.5 text-right font-mono font-medium text-slate-900 break-all">{c.subtotal.toFixed(2)}</td>
                </tr>
              )
            })}

            {/* Visual Extension Filler Block to emulate empty vertical grid lines */}
            <tr className="h-20 align-top select-none pointer-events-none text-[0px]">
              <td className="border-r border-slate-900">&nbsp;</td>
              <td className="border-r border-slate-900">&nbsp;</td>
              <td className="border-r border-slate-900">&nbsp;</td>
              <td className="border-r border-slate-900">&nbsp;</td>
              <td className="border-r border-slate-900">&nbsp;</td>
              <td className="border-r border-slate-900">&nbsp;</td>
              <td className="border-r border-slate-900">&nbsp;</td>
              <td className="border-r border-slate-900">&nbsp;</td>
              <td className="border-r border-slate-900">&nbsp;</td>
              {hasCess && <td className="border-r border-slate-900">&nbsp;</td>}
              <td className="border-r border-slate-900">&nbsp;</td>
              <td>&nbsp;</td>
            </tr>

            {/* Totals Summary Row matching item alignments */}
            <tr className="bg-slate-50/60 font-bold text-[10px] border-t-2 border-slate-900 align-middle tracking-tighter">
              <td className="p-1 border-r border-slate-900" />
              <td className="p-1 text-center text-slate-900 uppercase tracking-normal border-r border-slate-900">Totals</td>
              <td className="p-1 border-r border-slate-900" />
              <td className="p-1 text-center font-mono border-r border-slate-900 text-[9px] break-all">{data.items.reduce((s, i) => s + i.quantity, 0)} Units</td>
              <td className="p-1 border-r border-slate-900" />
              <td className="p-1 border-r border-slate-900" />
              <td className="p-1 text-right font-mono border-r border-slate-900 break-all">{totals.totalDisc.toFixed(2)}</td>
              <td className="p-1 text-right font-mono border-r border-slate-900 break-all">{totals.totalCD.toFixed(2)}</td>
              <td className="p-1 border-r border-slate-900" />
              {hasCess && <td className="p-1 border-r border-slate-900" />}
              <td className="p-1 text-right font-mono border-r border-slate-900 break-all">{totals.totalGST.toFixed(2)}</td>
              <td className="p-1 text-right font-mono text-slate-900 break-all">{totals.subtotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 border-b-2 border-slate-900 divide-x-2 divide-slate-900">
        <div className="p-3 flex flex-col justify-between space-y-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tax Amount Chargeable (in words)</p>
            <p className="font-medium text-blue-900 italic leading-relaxed">{amountInWords(totals.totalGST + totals.totalCess, data.currency)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Grand Amount (in words)</p>
            <p className="font-medium text-slate-800 italic leading-relaxed">{amountInWords(totals.grandTotal, data.currency)}</p>
          </div>
        </div>
        <div className="p-3 space-y-1.5 font-medium">
          <div className="flex justify-between text-slate-600"><span>Subtotal (Taxable)</span><span className="font-mono">{formatCurrency(totals.subtotal, data.currency)}</span></div>
          {totals.totalDisc > 0 && <div className="flex justify-between text-slate-500 text-[10px]"><span>Trade Discount</span><span className="font-mono">- {formatCurrency(totals.totalDisc, data.currency)}</span></div>}
          {totals.totalCD > 0 && <div className="flex justify-between text-slate-500 text-[10px]"><span>Cash Discount (CD)</span><span className="font-mono">- {formatCurrency(totals.totalCD, data.currency)}</span></div>}
          {hasCGST && <><div className="flex justify-between text-slate-600"><span>CGST</span><span className="font-mono">{formatCurrency(totals.totalCGST, data.currency)}</span></div><div className="flex justify-between text-slate-600"><span>SGST</span><span className="font-mono">{formatCurrency(totals.totalSGST, data.currency)}</span></div></>}
          {hasIGST && <div className="flex justify-between text-slate-600"><span>IGST</span><span className="font-mono">{formatCurrency(totals.totalIGST, data.currency)}</span></div>}
          {totals.totalCess > 0 && <div className="flex justify-between text-slate-600"><span>Total Cess</span><span className="font-mono">{formatCurrency(totals.totalCess, data.currency)}</span></div>}
          <div className="border-t border-dashed border-slate-400 my-1" />
          <div className="flex justify-between text-slate-600 font-medium"><span>Gross Amount</span><span className="font-mono">{formatCurrency(totals.grandTotal, data.currency)}</span></div>
          <div className="flex justify-between text-slate-900 font-bold text-sm bg-slate-100 p-1 rounded"><span>Net Amount (Rounded Off)</span><span className="font-mono text-emerald-700">{formatCurrency(Math.round(totals.grandTotal), data.currency)}</span></div>
        </div>
      </div>
      <div className="border-b-2 border-slate-900">
        <div className="p-1.5 border-b border-slate-900 font-bold tracking-wider text-[10px] text-slate-500 uppercase">GST Breakup Matrix</div>
        <table className="w-full border-collapse text-left text-[10px]">
          <thead><tr className="border-b border-slate-900 font-bold text-slate-700 divide-x divide-slate-900 bg-slate-100">
            <th className="p-1.5 text-center">HSN/SAC</th><th className="p-1.5 text-right">Taxable Value</th>
            {hasCGST && <><th className="p-1.5 text-right">CGST Amt</th><th className="p-1.5 text-right">SGST Amt</th></>}
            {hasIGST && <th className="p-1.5 text-right">IGST Amt</th>}
            {hasCess && <th className="p-1.5 text-right">Cess Amt</th>}
            <th className="p-1.5 text-right">Total Tax</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-300 font-mono text-slate-600">
            {totals.hsnBreakup.map(row => (
              <tr key={row.hsn} className="divide-x divide-slate-900">
                <td className="p-1.5 text-center font-bold text-slate-800">{row.hsn}</td>
                <td className="p-1.5 text-right">{formatCurrency(row.taxableValue, data.currency)}</td>
                {hasCGST && <><td className="p-1.5 text-right">{formatCurrency(row.cgstAmount, data.currency)}</td><td className="p-1.5 text-right">{formatCurrency(row.sgstAmount, data.currency)}</td></>}
                {hasIGST && <td className="p-1.5 text-right">{formatCurrency(row.igstAmount, data.currency)}</td>}
                {hasCess && <td className="p-1.5 text-right">{formatCurrency(row.cessAmount, data.currency)}</td>}
                <td className="p-1.5 text-right font-bold text-slate-900">{formatCurrency(row.totalTax, data.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-2 divide-x-2 divide-slate-900">
        <div className="p-3 space-y-0.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Bank Details</p>
          {data.bankName          && <p className="font-bold text-slate-900">{data.bankName}</p>}
          {data.bankAccountNumber && <p className="text-slate-600 font-mono">A/C: {data.bankAccountNumber}</p>}
          {data.bankIfsc          && <p className="text-slate-600 font-mono">IFSC: {data.bankIfsc}</p>}
          {data.bankBranch        && <p className="text-slate-600 text-[10px]">Branch: {data.bankBranch}</p>}
        </div>
        <div className="p-3 flex flex-col justify-between min-h-[72px]">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Declaration</p>
            <p className="text-slate-500 text-[10px] leading-tight">{data.termsAndConditions}</p>
            {data.jurisdictionCity && (
              <p className="text-slate-700 text-[10px] font-semibold mt-1">
                SUBJECT TO {data.jurisdictionCity.toUpperCase()} JURISDICTION
              </p>
            )}
          </div>
          <div className="-mx-3 border-t border-slate-300 mt-4" />
          <div className="text-right pt-1">
            <p className="font-bold text-slate-900 text-[10px] uppercase tracking-wide">For {data.sellerName || 'Your Business Name'}</p>
            <div className="h-10 flex items-center justify-end">
              {data.signatureImage && <img src={data.signatureImage} alt="Signature" className="h-full max-w-[120px] object-contain" />}
            </div>
            <p className="text-[9px] text-slate-400">Authorised Signatory</p>
          </div>
        </div>
      </div>
    </div>
  )
}