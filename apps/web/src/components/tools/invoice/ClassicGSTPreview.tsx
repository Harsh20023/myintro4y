'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import {
  InvoiceData,
  INDIAN_STATES,
  calcClassicItem, calcClassicTotals, formatCurrency, amountInWords,
  validateInvoiceNumber,
} from '@/lib/logic/invoice'

// Every section uses these — left half always has the right border at exactly 50%
const L = "w-1/2 shrink-0 border-r-2 border-slate-900"
const R = "w-1/2 shrink-0"

export default function ClassicGSTPreview({ data }: { data: InvoiceData }) {
  const totals = calcClassicTotals(data.items)
  const hasIGST = data.items.some(i => i.gstType === 'igst')
  const hasCGST = data.items.some(i => i.gstType === 'cgst_sgst')
  const hasCess = data.items.some(i => i.cessRate > 0)
  const formattedPOS = INDIAN_STATES.find(s => s.value === data.placeOfSupply)?.label || data.placeOfSupply
  const isInvNumValid = validateInvoiceNumber(data.invoiceNumber)

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!data.upiId) { setQrDataUrl(null); return }
    const upiString = `upi://pay?pa=${encodeURIComponent(data.upiId)}&pn=${encodeURIComponent(data.sellerName || '')}&am=${totals.grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(data.invoiceNumber || 'Invoice')}`
    QRCode.toDataURL(upiString, { width: 96, margin: 1 }).then(setQrDataUrl).catch(() => setQrDataUrl(null))
  }, [data.upiId, data.sellerName, data.invoiceNumber, totals.grandTotal])

  // For the items table we need left cols (Sr# + Description) to sum to exactly 50%
  // Sr#=5%, Description=45%, HSN=12%, Qty=10%, Rate=16%, Amount=17%  (with cess: adjust)
  // With cess: Sr#=5%, Desc=40%, HSN=11%, Qty=9%, Cess=8%, Rate=14%, Amount=13%
  const colsSanscess = "5% 45% 12% 10% 16% 12%"   // last two cols = Rate + Amount
  // GST breakup: HSN/SAC + Taxable = 50%, then tax cols split the rest

  return (
    <div
      id="invoice-preview"
      className="bg-white text-slate-800 border-2 border-slate-900 overflow-hidden font-sans text-xs shadow-sm max-w-[210mm] mx-auto"
    >
      {/* ── HEADER ── */}
      <div className="border-b-2 border-slate-900 p-2 text-center bg-slate-50">
        <h1 className="text-sm font-bold tracking-widest text-slate-900 uppercase">{data.isProforma ? 'Proforma Invoice' : 'Tax Invoice'}</h1>
      </div>

      {/* ── ROW 1: Seller | Invoice Details ── */}
      <div className="flex border-b-2 border-slate-900">
        <div className={`${L} p-3`}>
          <div className="flex gap-3 items-start">
            {data.sellerLogo && (
              <img src={data.sellerLogo} alt="Logo" className="h-14 w-auto max-w-[80px] object-contain flex-shrink-0" />
            )}
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seller</p>
              <p className="font-bold text-slate-900 text-sm">{data.sellerName || 'Your Business Name'}</p>
              <p className="text-slate-600 whitespace-pre-line">
                {data.sellerAddress || 'Seller Address Location'}
                {data.sellerLandmark && `\nLandmark: ${data.sellerLandmark}`}
              </p>
              {data.sellerGST && <p className="font-medium text-slate-900 pt-0.5">GSTIN: <span className="font-mono">{data.sellerGST}</span></p>}
              {data.sellerPAN && <p className="text-slate-500 font-mono text-[10px]">PAN: {data.sellerPAN}</p>}
            </div>
          </div>
        </div>
        <div className={`${R} p-3 space-y-1.5`}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice Details</p>
          <table className="w-full text-xs">
            <tbody>
              <tr>
                <td className="text-slate-500 pr-2 whitespace-nowrap pb-1 w-[40%]">Invoice No</td>
                <td className="font-mono font-bold pb-1">
                  {isInvNumValid || !data.invoiceNumber
                    ? <span className="text-slate-900">: {data.invoiceNumber || '—'}</span>
                    : <span className="text-red-600 bg-red-50 px-1 rounded">: {data.invoiceNumber} (!)</span>
                  }
                </td>
              </tr>
              <tr>
                <td className="text-slate-500 pr-2 pb-1">Date</td>
                <td className="pb-1">: {data.invoiceDate}</td>
              </tr>
              <tr>
                <td className="text-slate-500 pr-2 pb-1">Due Date</td>
                <td className="pb-1">: {data.dueDate}</td>
              </tr>
              <tr>
                <td className="text-slate-500 pr-2">Place of Supply</td>
                <td>: {formattedPOS}</td>
              </tr>
              <tr>
                <td className="text-slate-500 pr-2">Reverse Charge</td>
                <td className={data.reverseCharge ? 'font-semibold text-slate-900' : 'text-slate-500'}>: {data.reverseCharge ? 'Yes' : 'No'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ROW 2: Bill To | Ship To ── */}
      <div className="flex border-b-2 border-slate-900">
        <div className={`${L} p-3 space-y-1`}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bill To</p>
          <p className="font-bold text-slate-900">{data.buyerName || 'Client Business Name'}</p>
          <p className="text-slate-600 whitespace-pre-line">
            {data.buyerAddress || 'Client Billing Address'}
            {data.buyerLandmark && `\nLandmark: ${data.buyerLandmark}`}
          </p>
          {data.buyerGST && <p className="font-medium text-slate-900 pt-0.5">GSTIN: <span className="font-mono">{data.buyerGST}</span></p>}
          {data.buyerPAN && <p className="text-slate-500 font-mono text-[10px]">PAN: {data.buyerPAN}</p>}
        </div>
        <div className={`${R} p-3 space-y-1`}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ship To</p>
          <p className="font-bold text-slate-900">{data.shipToName || data.buyerName || 'Same as Billing'}</p>
          <p className="text-slate-600 whitespace-pre-line">
            {data.shipToAddress || data.buyerAddress || 'Same as Delivery Location'}
            {data.shipToLandmark && `\nLandmark: ${data.shipToLandmark}`}
          </p>
          <p className="font-medium text-slate-900 pt-0.5">GSTIN: <span className="font-mono">{data.shipToGST || data.buyerGST || '—'}</span></p>
        </div>
      </div>

      {/* ── ITEMS TABLE ──
           Left cols (Sr# + Description) must sum to 50% so the border aligns.
           Sr#=5%, Desc=45% → 50% | HSN=12%, Qty=10%, Rate=16%, Amt=12% → 50%
           With cess: Sr#=5%, Desc=40% → 45% | HSN=11%, Qty=9%, Cess=9%, Rate=13%, Amt=13% → 55%  (no perfect split possible with cess — keep Description wider)
      */}
      <div className="border-b-2 border-slate-900">
        <table className="w-full border-collapse text-left" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '5%' }} />
            <col style={{ width: hasCess ? '36%' : '45%' }} />
            <col style={{ width: hasCess ? '11%' : '12%' }} />
            <col style={{ width: hasCess ? '9%' : '10%' }} />
            {hasCess && <col style={{ width: '9%' }} />}
            <col style={{ width: hasCess ? '15%' : '16%' }} />
            <col style={{ width: hasCess ? '15%' : '12%' }} />
          </colgroup>
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-900 text-[11px] font-bold text-slate-900">
              <th className="p-2 text-center border-r-2 border-slate-900">Sr#</th>
              <th className="p-2 border-r-2 border-slate-900">Description of Goods</th>
              <th className="p-2 text-center border-r-2 border-slate-900">HSN</th>
              <th className={`p-2 text-center border-r-2 border-slate-900 ${hasCess ? '' : ''}`}>Qty</th>
              {hasCess && <th className="p-2 text-right border-r-2 border-slate-900">Cess %</th>}
              <th className="p-2 text-right border-r-2 border-slate-900">Rate</th>
              <th className="p-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.items.map((item, idx) => {
              const c = calcClassicItem(item)
              return (
                <tr key={item.id} className="text-slate-700">
                  <td className="p-2 text-center font-mono border-r-2 border-slate-900">{idx + 1}</td>
                  <td className="p-2 font-medium text-slate-900 border-r-2 border-slate-900 truncate">{item.description || '—'}</td>
                  <td className="p-2 text-center font-mono text-slate-600 border-r-2 border-slate-900">{item.hsn || '—'}</td>
                  <td className={`p-2 text-center font-mono border-r-2 border-slate-900`}>{item.quantity}</td>
                  {hasCess && <td className="p-2 text-center font-mono border-r-2 border-slate-900">{item.cessRate}%</td>}
                  <td className="p-2 text-right font-mono border-r-2 border-slate-900">{formatCurrency(item.rate, data.currency)}</td>
                  <td className="p-2 text-right font-mono font-bold text-slate-900">{formatCurrency(c.subtotal, data.currency)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── ROW 3: Amount in Words | Totals ── */}
      <div className="flex border-b-2 border-slate-900">
        <div className={`${L} p-3 flex flex-col justify-between space-y-4`}>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tax Amount Chargeable (in words)</p>
            <p className="font-medium text-blue-900 italic leading-relaxed">
              {amountInWords(totals.totalGST + totals.totalCess, data.currency)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Grand Amount (in words)</p>
            <p className="font-medium text-slate-800 italic leading-relaxed">{amountInWords(totals.grandTotal, data.currency)}</p>
          </div>
        </div>
        <div className={`${R} p-3 space-y-1.5 font-medium`}>
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-mono">{formatCurrency(totals.subtotal, data.currency)}</span>
          </div>
          {hasCGST && <>
            <div className="flex justify-between text-slate-600">
              <span>CGST Summary</span>
              <span className="font-mono">{formatCurrency(totals.totalCGST, data.currency)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>SGST Summary</span>
              <span className="font-mono">{formatCurrency(totals.totalSGST, data.currency)}</span>
            </div>
          </>}
          {hasIGST && <div className="flex justify-between text-slate-600">
            <span>IGST Summary</span>
            <span className="font-mono">{formatCurrency(totals.totalIGST, data.currency)}</span>
          </div>}
          {totals.totalCess > 0 && <div className="flex justify-between text-slate-600">
            <span>Total Cess</span>
            <span className="font-mono">{formatCurrency(totals.totalCess, data.currency)}</span>
          </div>}
          <div className="border-t border-dashed border-slate-400 my-1" />
          <div className="flex justify-between text-slate-900 font-bold text-sm bg-slate-100 p-1 rounded">
            <span>TOTAL</span>
            <span className="font-mono text-emerald-700">{formatCurrency(totals.grandTotal, data.currency)}</span>
          </div>
        </div>
      </div>

      {/* ── GST BREAKUP MATRIX ──
           HSN/SAC col = 20%, Taxable Value col = 30% → left side = 50%
           Then tax cols split the right 50%
      */}
      <div className="border-b-2 border-slate-900">
        <div className="p-1.5 border-b border-slate-900 font-bold tracking-wider text-[10px] text-slate-500 uppercase">
          GST Breakup Matrix
        </div>
        <table className="w-full border-collapse text-left text-[10px]" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '30%' }} />
            {hasCGST && <col style={{ width: hasCess ? '10%' : (hasIGST ? '12%' : '17%') }} />}
            {hasCGST && <col style={{ width: hasCess ? '10%' : (hasIGST ? '12%' : '17%') }} />}
            {hasIGST && <col style={{ width: hasCess ? '10%' : '17%' }} />}
            {hasCess && <col style={{ width: '10%' }} />}
            <col style={{ width: '16%' }} />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-900 font-bold text-slate-700 bg-slate-100">
              <th className="p-1.5 text-center border-r border-slate-900">HSN/SAC</th>
              <th className="p-1.5 text-right border-r border-slate-900">Taxable Value</th>
              {hasCGST && <th className="p-1.5 text-right border-r border-slate-900">CGST</th>}
              {hasCGST && <th className="p-1.5 text-right border-r border-slate-900">SGST</th>}
              {hasIGST && <th className="p-1.5 text-right border-r border-slate-900">IGST</th>}
              {hasCess && <th className="p-1.5 text-right border-r border-slate-900">Cess</th>}
              <th className="p-1.5 text-right">Total Tax</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300 font-mono text-slate-600">
            {totals.hsnBreakup.map((row) => (
              <tr key={row.hsn}>
                <td className="p-1.5 text-center font-bold text-slate-800 border-r border-slate-900">{row.hsn}</td>
                <td className="p-1.5 text-right border-r border-slate-900">{formatCurrency(row.taxableValue, data.currency)}</td>
                {hasCGST && <td className="p-1.5 text-right border-r border-slate-900">{formatCurrency(row.cgstAmount, data.currency)}</td>}
                {hasCGST && <td className="p-1.5 text-right border-r border-slate-900">{formatCurrency(row.sgstAmount, data.currency)}</td>}
                {hasIGST && <td className="p-1.5 text-right border-r border-slate-900">{formatCurrency(row.igstAmount, data.currency)}</td>}
                {hasCess && <td className="p-1.5 text-right border-r border-slate-900">{formatCurrency(row.cessAmount, data.currency)}</td>}
                <td className="p-1.5 text-right font-bold text-slate-900">{formatCurrency(row.totalTax, data.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── ROW 4: Bank Details | Declaration ── */}
      <div className="flex">
        <div className={`${L} p-3 flex gap-3`}>
          <div className="flex-1 space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Bank Details</p>
            {data.bankName          && <p className="font-bold text-slate-900">{data.bankName}</p>}
            {data.bankAccountNumber && <p className="text-slate-600 font-mono">A/C: {data.bankAccountNumber}</p>}
            {data.bankIfsc          && <p className="text-slate-600 font-mono">IFSC: {data.bankIfsc}</p>}
            {data.bankBranch        && <p className="text-slate-600 text-[10px]">Branch: {data.bankBranch}</p>}
            {data.upiId             && <p className="text-slate-600 font-mono text-[10px]">UPI: {data.upiId}</p>}
          </div>
          {qrDataUrl && (
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <img src={qrDataUrl} alt="UPI QR" className="w-20 h-20 border border-slate-200 rounded" />
              <p className="text-[9px] text-slate-400">Scan to Pay</p>
            </div>
          )}
        </div>
        <div className={`${R} p-3 flex flex-col justify-between min-h-[72px]`}>
          <div>
            <p className="text-[10px] font-bold text-slate-900 uppercase tracking-wider mb-0.5">Declaration</p>
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