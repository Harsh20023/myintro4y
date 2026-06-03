// // Pure business logic for invoice generation
// // No React, no UI — can run on server side too

// export type GSTType = 'none' | 'cgst_sgst' | 'igst'
// export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP'

// export interface InvoiceItem {
//   id: string
//   description: string
//   quantity: number
//   rate: number
//   gstRate: number  // percentage e.g. 18
//   gstType: GSTType
// }

// export interface InvoiceData {
//   // Seller
//   sellerName: string
//   sellerAddress: string
//   sellerGST: string
//   sellerPhone: string
//   sellerEmail: string

//   // Buyer
//   buyerName: string
//   buyerAddress: string
//   buyerGST: string

//   // Invoice meta
//   invoiceNumber: string
//   invoiceDate: string
//   dueDate: string
//   currency: CurrencyCode
//   notes: string
//   termsAndConditions: string

//   // Items
//   items: InvoiceItem[]
// }

// export interface InvoiceItemCalculated extends InvoiceItem {
//   subtotal: number    // qty * rate
//   cgst: number
//   sgst: number
//   igst: number
//   total: number
// }

// export interface InvoiceTotals {
//   subtotal: number
//   totalCGST: number
//   totalSGST: number
//   totalIGST: number
//   totalGST: number
//   grandTotal: number
// }

// export function calcItem(item: InvoiceItem): InvoiceItemCalculated {
//   const subtotal = item.quantity * item.rate
//   const gstAmount = (subtotal * item.gstRate) / 100
//   let cgst = 0, sgst = 0, igst = 0

//   if (item.gstType === 'cgst_sgst') {
//     cgst = gstAmount / 2
//     sgst = gstAmount / 2
//   } else if (item.gstType === 'igst') {
//     igst = gstAmount
//   }

//   return { ...item, subtotal, cgst, sgst, igst, total: subtotal + gstAmount }
// }

// export function calcTotals(items: InvoiceItem[]): InvoiceTotals {
//   const calculated = items.map(calcItem)
//   return {
//     subtotal:   calculated.reduce((s, i) => s + i.subtotal, 0),
//     totalCGST:  calculated.reduce((s, i) => s + i.cgst,    0),
//     totalSGST:  calculated.reduce((s, i) => s + i.sgst,    0),
//     totalIGST:  calculated.reduce((s, i) => s + i.igst,    0),
//     totalGST:   calculated.reduce((s, i) => s + i.cgst + i.sgst + i.igst, 0),
//     grandTotal: calculated.reduce((s, i) => s + i.total,   0),
//   }
// }

// export function formatCurrency(amount: number, currency: CurrencyCode = 'INR'): string {
//   return new Intl.NumberFormat('en-IN', {
//     style: 'currency',
//     currency,
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   }).format(amount)
// }

// export function generateInvoiceNumber(): string {
//   const year = new Date().getFullYear()
//   const month = String(new Date().getMonth() + 1).padStart(2, '0')
//   const rand = Math.floor(Math.random() * 9000) + 1000
//   return `INV-${year}${month}-${rand}`
// }

// export function amountInWords(amount: number): string {
//   const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
//     'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
//   const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

//   function convert(n: number): string {
//     if (n < 20) return ones[n]
//     if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
//     if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '')
//     if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '')
//     if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '')
//     return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '')
//   }

//   const rupees = Math.floor(amount)
//   const paise  = Math.round((amount - rupees) * 100)

//   let words = 'Rupees ' + (rupees === 0 ? 'Zero' : convert(rupees))
//   if (paise > 0) words += ' and ' + convert(paise) + ' Paise'
//   return words + ' Only'
// }

// export function newItem(): InvoiceItem {
//   return {
//     id: Math.random().toString(36).slice(2),
//     description: '',
//     quantity: 1,
//     rate: 0,
//     gstRate: 18,
//     gstType: 'cgst_sgst',
//   }
// }

// export const DEFAULT_INVOICE: InvoiceData = {
//   sellerName: '',
//   sellerAddress: '',
//   sellerGST: '',
//   sellerPhone: '',
//   sellerEmail: '',
//   buyerName: '',
//   buyerAddress: '',
//   buyerGST: '',
//   invoiceNumber: generateInvoiceNumber(),
//   invoiceDate: new Date().toISOString().split('T')[0],
//   dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
//   currency: 'INR',
//   notes: '',
//   termsAndConditions: 'Payment due within 15 days. Late payments attract 18% per annum.',
//   items: [newItem()],
// }

// export const GST_RATES = [0, 5, 12, 18, 28]
// export const CURRENCIES: { value: CurrencyCode; label: string }[] = [
//   { value: 'INR', label: '₹ Indian Rupee (INR)' },
//   { value: 'USD', label: '$ US Dollar (USD)' },
//   { value: 'EUR', label: '€ Euro (EUR)' },
//   { value: 'GBP', label: '£ British Pound (GBP)' },
// ]
export type GSTType = 'none' | 'cgst_sgst' | 'igst'
export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP'

export interface InvoiceItem {
  id: string
  description: string
  hsn: string        // Added HSN Field
  quantity: number
  rate: number
  gstRate: number    // e.g., 18
  gstType: GSTType
}

export interface InvoiceData {
  sellerName: string
  sellerAddress: string
  sellerGST: string
  sellerPhone: string
  sellerEmail: string

  buyerName: string
  buyerAddress: string
  buyerGST: string
  
  // Added Explicit Consignee Structure
  shipToName?: string
  shipToAddress?: string
  shipToGST?: string

  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  placeOfSupply: string // Added Place of Supply
  currency: CurrencyCode
  notes: string
  termsAndConditions: string
  items: InvoiceItem[]
}

export interface InvoiceItemCalculated extends InvoiceItem {
  subtotal: number
  cgst: number
  sgst: number
  igst: number
  total: number
}

export interface HsnBreakupRow {
  hsn: string
  taxableValue: number
  cgstRate: number
  cgstAmount: number
  sgstRate: number
  sgstAmount: number
  igstRate: number
  igstAmount: number
  totalTax: number
}

export interface InvoiceTotals {
  subtotal: number
  totalCGST: number
  totalSGST: number
  totalIGST: number
  totalGST: number
  grandTotal: number
  hsnBreakup: HsnBreakupRow[] // Array map for GST table
}

export function calcItem(item: InvoiceItem): InvoiceItemCalculated {
  const subtotal = item.quantity * item.rate
  const gstAmount = (subtotal * item.gstRate) / 100
  let cgst = 0, sgst = 0, igst = 0

  if (item.gstType === 'cgst_sgst') {
    cgst = gstAmount / 2
    sgst = gstAmount / 2
  } else if (item.gstType === 'igst') {
    igst = gstAmount
  }

  return { ...item, subtotal, cgst, sgst, igst, total: subtotal + gstAmount }
}

export function calcTotals(items: InvoiceItem[]): InvoiceTotals {
  const calculated = items.map(calcItem)
  
  const subtotal = calculated.reduce((s, i) => s + i.subtotal, 0)
  const totalCGST = calculated.reduce((s, i) => s + i.cgst, 0)
  const totalSGST = calculated.reduce((s, i) => s + i.sgst, 0)
  const totalIGST = calculated.reduce((s, i) => s + i.igst, 0)
  const totalGST = totalCGST + totalSGST + totalIGST
  const grandTotal = subtotal + totalGST

  // Build HSN Breakup Map Aggregations
  const hsnMap: Record<string, HsnBreakupRow> = {}
  calculated.forEach(item => {
    const code = item.hsn || '—'
    if (!hsnMap[code]) {
      hsnMap[code] = {
        hsn: code,
        taxableValue: 0,
        cgstRate: item.gstType === 'cgst_sgst' ? item.gstRate / 2 : 0,
        cgstAmount: 0,
        sgstRate: item.gstType === 'cgst_sgst' ? item.gstRate / 2 : 0,
        sgstAmount: 0,
        igstRate: item.gstType === 'igst' ? item.gstRate : 0,
        igstAmount: 0,
        totalTax: 0
      }
    }
    hsnMap[code].taxableValue += item.subtotal
    hsnMap[code].cgstAmount += item.cgst
    hsnMap[code].sgstAmount += item.sgst
    hsnMap[code].igstAmount += item.igst
    hsnMap[code].totalTax += (item.cgst + item.sgst + item.igst)
  })

  return {
    subtotal,
    totalCGST,
    totalSGST,
    totalIGST,
    totalGST,
    grandTotal,
    hsnBreakup: Object.values(hsnMap)
  }
}

export function formatCurrency(amount: number, currency: CurrencyCode = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function amountInWords(amount: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function convert(n: number): string {
    if (n < 20) return ones[n]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '')
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '')
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '')
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '')
  }

  const rupees = Math.floor(amount)
  const paise = Math.round((amount - rupees) * 100)

  let words = 'Rupees ' + (rupees === 0 ? 'Zero' : convert(rupees))
  if (paise > 0) words += ' and ' + convert(paise) + ' Paise'
  return words + ' Only'
}

export function newItem(): InvoiceItem {
  return {
    id: Math.random().toString(36).slice(2),
    description: '',
    hsn: '',
    quantity: 1,
    rate: 0,
    gstRate: 18,
    gstType: 'cgst_sgst',
  }
}

export const DEFAULT_INVOICE: InvoiceData = {
  sellerName: '',
  sellerAddress: '',
  sellerGST: '',
  sellerPhone: '',
  sellerEmail: '',
  buyerName: '',
  buyerAddress: '',
  buyerGST: '',
  shipToName: '',
  shipToAddress: '',
  shipToGST: '',
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
  placeOfSupply: 'Haryana',
  currency: 'INR',
  notes: '',
  termsAndConditions: 'We declare that the above particulars are true and correct.',
  items: [newItem()],
}

export const GST_RATES = [0, 5, 12, 18, 28]
export const CURRENCIES: { value: CurrencyCode; label: string }[] = [
  { value: 'INR', label: '₹ Indian Rupee (INR)' },
  { value: 'USD', label: '$ US Dollar (USD)' },
  { value: 'EUR', label: '€ Euro (EUR)' },
  { value: 'GBP', label: '£ British Pound (GBP)' },
]