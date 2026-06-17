'use client'

import { useState, useCallback } from 'react'
import { Plus, Trash2, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { Input, Select, Textarea } from '@/components/ui'
import {
  InvoiceData, InvoiceItem, CurrencyCode,
  CURRENCIES, GST_RATES, CESS_RATES, INDIAN_STATES,
  calcClassicItem, formatCurrency, newItem,
  validateInvoiceNumber, extractPANFromGST, computeOffsetDueDate,
  validatePAN,
} from '@/lib/logic/invoice'

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function validateGSTIN(gstin: string): string | null {
  if (!gstin) return null
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  if (!regex.test(gstin.trim().toUpperCase())) return 'Invalid GSTIN format (e.g. 06ABCDE1234F1Z5)'
  return null
}
function validatePhone(phone: string): string | null {
  if (!phone) return null
  if (phone.replace(/\D/g, '').length !== 10) return 'Enter a valid 10-digit mobile number'
  return null
}
function validateEmail(email: string): string | null {
  if (!email) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address'
  return null
}
function validateDate(dateStr: string): string | null {
  if (!dateStr) return 'Date is required'
  if (isNaN(new Date(dateStr).getTime())) return 'Invalid date'
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

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function FieldError({ msg }: { msg: string | null | undefined }) {
  if (!msg) return null
  return (
    <p className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5 font-medium">
      <AlertCircle size={10} className="shrink-0" /> {msg}
    </p>
  )
}

function Section({
  title, children, defaultOpen = true, hasError = false,
}: {
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
// CLASSIC ITEM ROW — uses direct `rate`, no MRP/disc/CD
// ─────────────────────────────────────────────────────────────────────────────
function ClassicItemRow({
  item, index, onChange, onRemove, canRemove, currency,
}: {
  item: InvoiceItem
  index: number
  onChange: (id: string, field: keyof InvoiceItem, value: string | number) => void
  onRemove: (id: string) => void
  canRemove: boolean
  currency: string
}) {
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [customCess, setCustomCess] = useState(false)
  const [rateExceeded, setRateExceeded] = useState(false)
  const [qtyExceeded, setQtyExceeded] = useState(false)
  const touch = (f: string) => setTouched(p => ({ ...p, [f]: true }))
  const t = (f: string) => touched[f] ?? false

  const c = calcClassicItem(item)

  const errDesc = t('description') ? validateRequired(item.description, 'Description') : null
  const errHSN = t('hsn') && item.hsn
    ? (!/^\d{4}(\d{2}(\d{2})?)?$/.test(item.hsn.trim()) ? 'HSN must be 4, 6, or 8 digits' : null)
    : null
  const errQty = t('quantity') ? (item.quantity <= 0 ? 'Qty must be > 0' : null) : null
  const errRate = t('rate') ? (item.rate < 0 ? 'Rate cannot be negative' : item.rate > 10000000 ? 'Rate cannot exceed ₹1 Crore' : null) : null

  return (
    <div className="grid gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">Line Item {index + 1}</span>
        {canRemove && (
          <button type="button" onClick={() => onRemove(item.id)}
            className="p-1 text-slate-400 hover:text-red-500 transition-colors">
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
            onChange={e => {
              const v = e.target.value.replace(/\D/g, '')
              onChange(item.id, 'hsn', v)
            }}
            onBlur={() => touch('hsn')}
            maxLength={8}
            inputMode="numeric"
            className={errHSN ? 'border-red-400' : ''} />
          <FieldError msg={errHSN} />
        </div>
      </div>

      {/* Qty + Rate + Amount preview */}
      <div className="grid grid-cols-3 gap-2">
        <div className="relative">
          {qtyExceeded && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-red-500 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
              Cannot exceed 10 Lakh
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-red-500" />
            </div>
          )}
          <Input label="Qty *" type="number" min="1" max="1000000" value={item.quantity}
            onChange={e => {
              const v = parseFloat(e.target.value)
              if (!isNaN(v) && v > 1000000) { setQtyExceeded(true); return }
              setQtyExceeded(false)
              onChange(item.id, 'quantity', v || 0)
            }}
            onBlur={() => touch('quantity')}
            className={qtyExceeded || errQty ? 'border-red-400' : ''} />
          <FieldError msg={!qtyExceeded ? errQty : null} />
        </div>
        <div className="relative">
          {rateExceeded && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-red-500 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
              Cannot exceed ₹1 Crore
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-red-500" />
            </div>
          )}
          <Input label="Rate (per unit) *" type="number" min="0" max="10000000" step="0.01" value={item.rate}
            onChange={e => {
              const v = parseFloat(e.target.value)
              if (!isNaN(v) && v > 10000000) { setRateExceeded(true); return }
              setRateExceeded(false)
              onChange(item.id, 'rate', v || 0)
            }}
            onBlur={() => touch('rate')}
            className={rateExceeded || errRate ? 'border-red-400' : ''} />
          <FieldError msg={!rateExceeded ? errRate : null} />
        </div>
        <div className="flex flex-col justify-end">
          <label className="text-[10px] text-slate-500 font-medium mb-1">Subtotal</label>
          <div className="h-9 flex items-center px-2 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-700 select-none">
            {formatCurrency(c.subtotal, currency as any)}
          </div>
        </div>
      </div>

      {/* GST Rate + Tax Type + Cess */}
      <div className="grid grid-cols-3 gap-2">
        <Select label="GST Rate" value={String(item.gstRate)}
          options={GST_RATES.map(r => ({ value: String(r), label: `${r}%` }))}
          onChange={e => onChange(item.id, 'gstRate', parseInt(e.target.value))} />
        <Select label="Tax Type" value={item.gstType}
          options={[
            { value: 'none', label: 'Exempt' },
            { value: 'cgst_sgst', label: 'CGST + SGST' },
            { value: 'igst', label: 'IGST' },
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
              onChange={e => {
                if (e.target.value === 'custom') setCustomCess(true)
                else onChange(item.id, 'cessRate', parseFloat(e.target.value))
              }} />
          )}
        </div>
      </div>

      {/* Line total summary */}
      <div className="flex justify-end gap-4 text-[10px] text-slate-500 border-t border-slate-200 pt-2 mt-1">
        <span>GST: <span className="font-mono text-slate-700">{formatCurrency(c.gstAmt, currency as any)}</span></span>
        {item.cessRate > 0 && <span>Cess: <span className="font-mono text-slate-700">{formatCurrency(c.cess, currency as any)}</span></span>}
        <span className="font-bold text-slate-800">Total: <span className="font-mono">{formatCurrency(c.total, currency as any)}</span></span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────
interface ClassicGSTFormProps {
  data: InvoiceData
  set: <K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => void
  updateItem: (id: string, field: keyof InvoiceItem, value: string | number) => void
  addItem: () => void
  removeItem: (id: string) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN FORM — Classic GST (B2B goods, direct rate per unit)
// ─────────────────────────────────────────────────────────────────────────────
export default function ClassicGSTForm({ data, set, updateItem, addItem, removeItem }: ClassicGSTFormProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [creditDaysExceeded, setCreditDaysExceeded] = useState(false)
  const touch = (f: string) => setTouched(p => ({ ...p, [f]: true }))
  const t = (f: string) => touched[f] ?? false

  const errors = {
    invoiceNumber:    !validateInvoiceNumber(data.invoiceNumber) ? "Max 16 chars. Alphanumeric, '/' and '-' only." : null,
    invoiceDate:      validateDate(data.invoiceDate),
    dueDate:          validateDueDate(data.invoiceDate, data.dueDate),
    paymentTermsDays: data.paymentTermsType === 'days' && data.paymentTermsDays <= 0 ? 'Credit days must be > 0' : null,
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

  const sec1Err = ['invoiceNumber', 'invoiceDate', 'dueDate', 'paymentTermsDays'].some(k => t(k) && (errors as any)[k])
  const sec2Err = ['sellerName', 'sellerAddress', 'sellerGST', 'sellerPAN', 'sellerPhone', 'sellerEmail'].some(k => t(k) && (errors as any)[k])
  const sec3Err = ['buyerName', 'buyerAddress', 'buyerGST', 'buyerPAN', 'shipToGST'].some(k => t(k) && (errors as any)[k])

  return (
    <div className="space-y-4">

      {/* ── SECTION 1: INVOICE METADATA ── */}
      <Section title="1. Invoice Details" hasError={sec1Err}>
        <div className="space-y-2">
          <div>
            <Input label="Invoice Number *" value={data.invoiceNumber}
              onChange={e => set('invoiceNumber', e.target.value)}
              onBlur={() => touch('invoiceNumber')}
              placeholder="e.g. INV/2024/001"
              className={t('invoiceNumber') && errors.invoiceNumber ? 'border-red-400' : ''} />
            <FieldError msg={t('invoiceNumber') ? errors.invoiceNumber : null} />
          </div>

          <Select label="Place of Supply *" value={data.placeOfSupply}
            options={INDIAN_STATES}
            onChange={e => set('placeOfSupply', e.target.value)} />

          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-700">
            <input type="checkbox" checked={data.reverseCharge}
              onChange={e => set('reverseCharge', e.target.checked)}
              className="w-4 h-4 rounded border-slate-400 accent-slate-800" />
            Reverse Charge Applicable
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-700">
            <input type="checkbox" checked={data.isProforma}
              onChange={e => set('isProforma', e.target.checked)}
              className="w-4 h-4 rounded border-slate-400 accent-slate-800" />
            Proforma Invoice (instead of Tax Invoice)
          </label>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Input label="Invoice Date *" type="date" value={data.invoiceDate}
                onChange={e => set('invoiceDate', e.target.value)}
                onBlur={() => touch('invoiceDate')}
                className={t('invoiceDate') && errors.invoiceDate ? 'border-red-400' : ''} />
              <FieldError msg={t('invoiceDate') ? errors.invoiceDate : null} />
            </div>
            <Select label="Payment Terms" value={data.paymentTermsType}
              options={[
                { value: 'days', label: 'Net Days' },
                { value: 'custom', label: 'Fixed Date' },
              ]}
              onChange={e => set('paymentTermsType', e.target.value as any)} />
          </div>

          {data.paymentTermsType === 'days' ? (
            <div>
              <div className="relative">
                {creditDaysExceeded && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-red-500 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                    Cannot exceed 1000 days
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-red-500" />
                  </div>
                )}
                <Input label="Credit Period (Days) *" type="number" min="1" max="1000" value={data.paymentTermsDays}
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
              {data.dueDate && (
                <p className="text-[10px] text-slate-400 mt-0.5">Due: {data.dueDate}</p>
              )}
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

          <Select label="Billing Currency" value={data.currency}
            options={CURRENCIES}
            onChange={e => set('currency', e.target.value as CurrencyCode)} />
        </div>
      </Section>

      {/* ── SECTION 2: SELLER ── */}
      <Section title="2. Seller Details" hasError={sec2Err}>
        {/* Logo upload */}
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Company Logo (optional)</p>
          {data.sellerLogo ? (
            <div className="flex items-center gap-3 p-2 border border-slate-200 rounded-lg bg-slate-50">
              <img src={data.sellerLogo} alt="Logo" className="h-12 w-auto max-w-[120px] object-contain" />
              <button onClick={() => set('sellerLogo', '')}
                className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
            </div>
          ) : (
            <label className="flex items-center gap-2 cursor-pointer border border-dashed border-slate-300 rounded-lg px-3 py-2.5 hover:bg-slate-50 transition-colors">
              <span className="text-xs text-slate-500">Click to upload logo (PNG, JPG, SVG)</span>
              <input type="file" accept="image/*" className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = ev => set('sellerLogo', ev.target?.result as string)
                    reader.readAsDataURL(file)
                  }
                }} />
            </label>
          )}
        </div>

        <div>
          <Input label="Legal / Business Name *" value={data.sellerName}
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
          onChange={e => set('sellerLandmark', e.target.value)}
          placeholder="Optional" />
        <div>
          <Input label="Seller GSTIN" value={data.sellerGST}
            onChange={e => {
              const val = e.target.value.toUpperCase()
              set('sellerGST', val)
            }}
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
              Auto-detected PAN: <span className="font-bold text-slate-700">{data.sellerPAN}</span>
              {!errors.sellerPAN && <CheckCircle2 size={10} className="text-emerald-500 inline ml-1" />}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input label="Phone" type="tel" value={data.sellerPhone}
              onChange={e => set('sellerPhone', e.target.value)}
              onBlur={() => touch('sellerPhone')}
              maxLength={10} placeholder="10-digit number"
              className={t('sellerPhone') && errors.sellerPhone ? 'border-red-400' : ''} />
            <FieldError msg={t('sellerPhone') ? errors.sellerPhone : null} />
          </div>
          <div>
            <Input label="Email" type="email" value={data.sellerEmail}
              onChange={e => set('sellerEmail', e.target.value)}
              onBlur={() => touch('sellerEmail')}
              placeholder="name@example.com"
              className={t('sellerEmail') && errors.sellerEmail ? 'border-red-400' : ''} />
            <FieldError msg={t('sellerEmail') ? errors.sellerEmail : null} />
          </div>
        </div>
      </Section>

      {/* ── SECTION 3: BUYER + SHIP TO ── */}
      <Section title="3. Bill To / Ship To" hasError={sec3Err}>
        {/* Billing */}
        <div className="bg-slate-50 p-2 rounded-lg space-y-2 border border-slate-200">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Billing Party</p>
          <div>
            <Input label="Buyer / Client Name *" value={data.buyerName}
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
          <Input label="Landmark" value={data.buyerLandmark || ''}
            onChange={e => set('buyerLandmark', e.target.value)}
            placeholder="Optional" />
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
            {data.buyerPAN && (
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                Auto-detected PAN: <span className="font-bold text-slate-700">{data.buyerPAN}</span>
              </p>
            )}
          </div>
        </div>

        {/* Shipping */}
        <div className="bg-slate-50 p-2 rounded-lg space-y-2 border border-slate-200">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Shipping Address <span className="normal-case font-normal">(optional)</span></p>
          <Input label="Ship-To Name" placeholder="Leave empty if same as billing"
            value={data.shipToName || ''}
            onChange={e => set('shipToName', e.target.value)} />
          <Textarea label="Shipping Address" rows={2}
            value={data.shipToAddress || ''}
            onChange={e => set('shipToAddress', e.target.value)} />
          <Input label="Shipping Landmark"
            value={data.shipToLandmark || ''}
            onChange={e => set('shipToLandmark', e.target.value)} />
          <div>
            <Input label="Shipping GSTIN" value={data.shipToGST || ''}
              onChange={e => set('shipToGST', e.target.value.toUpperCase())}
              onBlur={() => touch('shipToGST')}
              maxLength={15} placeholder="Required if ship-to differs"
              className={t('shipToGST') && errors.shipToGST ? 'border-red-400' : ''} />
            {t('shipToGST') && errors.shipToGST
              ? <FieldError msg={errors.shipToGST} />
              : data.shipToGST && !errors.shipToGST
                ? <p className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5"><CheckCircle2 size={10} /> Valid GSTIN</p>
                : null}
          </div>
        </div>
      </Section>

      {/* ── SECTION 4: LINE ITEMS ── */}
      <Section title="4. Line Items (Goods)">
        <div className="space-y-2">
          {data.items.map((item, idx) => (
            <ClassicItemRow
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
        {data.items.length === 0 && (
          <p className="text-[10px] text-red-500 flex items-center gap-1">
            <AlertCircle size={10} /> At least one line item is required
          </p>
        )}
        <button type="button" onClick={addItem}
          className="w-full py-2 bg-slate-100 hover:bg-slate-200 border-2 border-dashed border-slate-300 font-bold text-xs text-slate-700 rounded-xl mt-2 flex items-center justify-center gap-1 transition-colors">
          <Plus size={14} /> Add Line Item
        </button>
      </Section>

      {/* ── SECTION 5: NOTES & TERMS ── */}
      <Section title="5. Bank Details" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2">
          <Input label="Bank Name" value={data.bankName ?? ''}
            onChange={e => set('bankName', e.target.value)}
            placeholder="e.g. IDFC FIRST" />
          <Input label="Account Number" value={data.bankAccountNumber ?? ''}
            onChange={e => set('bankAccountNumber', e.target.value.replace(/\D/g, ''))}
            placeholder="e.g. 10215939113"
            maxLength={18}
            inputMode="numeric"
            error={data.bankAccountNumber && !/^\d{9,18}$/.test(data.bankAccountNumber) ? 'Account number must be 9–18 digits' : undefined} />
          <Input label="IFSC Code" value={data.bankIfsc ?? ''}
            onChange={e => set('bankIfsc', e.target.value.toUpperCase())}
            placeholder="e.g. IDFB0020129"
            maxLength={11}
            error={data.bankIfsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.bankIfsc) ? 'Invalid IFSC — must be 11 chars: 4 letters + 0 + 6 alphanumeric' : undefined} />
          <Input label="Branch" value={data.bankBranch ?? ''}
            onChange={e => { if (e.target.value.length <= 100) set('bankBranch', e.target.value) }}
            placeholder="e.g. Gurgaon Sohna Road Branch"
            maxLength={100}
            error={data.bankBranch && data.bankBranch.length > 100 ? 'Branch name must be under 100 characters' : undefined} />
          <Input label="UPI ID" value={data.upiId ?? ''}
            onChange={e => { if (e.target.value.length <= 33) set('upiId', e.target.value) }}
            placeholder="e.g. business@upi"
            maxLength={33}
            className="col-span-2" />
        </div>
      </Section>
      <Section title="6. Notes & Terms" defaultOpen={false}>
        <Textarea label="Notes (internal / optional)" rows={2}
          value={data.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Any additional notes for this invoice" />
        <Textarea label="Terms & Declaration" rows={3}
          value={data.termsAndConditions}
          onChange={e => set('termsAndConditions', e.target.value)} />
        <Input label="Jurisdiction City (optional)" value={data.jurisdictionCity ?? ''}
          onChange={e => set('jurisdictionCity', e.target.value)}
          placeholder="e.g. Gurgaon — prints as SUBJECT TO GURGAON JURISDICTION" />
      </Section>
      <Section title="7. Signature">
        <p className="text-[11px] text-slate-400">Upload will appear in the signature space on the invoice.</p>
        <input type="file" accept="image/*"
          onChange={e => {
            const file = e.target.files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = ev => set('signatureImage', ev.target?.result as string)
            reader.readAsDataURL(file)
          }}
          className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
        {data.signatureImage && (
          <div className="flex items-center gap-3">
            <img src={data.signatureImage} alt="Signature" className="h-12 max-w-[180px] object-contain border border-slate-200 rounded" />
            <button type="button" onClick={() => set('signatureImage', '')}
              className="text-[11px] text-red-500 hover:text-red-700">Remove</button>
          </div>
        )}
      </Section>
    </div>
  )
}