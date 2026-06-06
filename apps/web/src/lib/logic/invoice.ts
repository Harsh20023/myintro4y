
// export type GSTType = 'none' | 'cgst_sgst' | 'igst'
// export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP'

// export interface InvoiceItem {
//   id: string
//   description: string
//   hsn: string
//   quantity: number
//   rate: number
//   gstRate: number
//   gstType: GSTType
//   cessRate: number // Feature #3: Item-level Cess Rate %
// }

// export interface InvoiceData {
//   sellerName: string
//   sellerAddress: string
//   sellerLandmark?: string // Feature #6: Landmark extension
//   sellerGST: string
//   sellerPAN?: string // Feature #9: Explicit PAN Tracking
//   sellerPhone: string
//   sellerEmail: string

//   buyerName: string
//   buyerAddress: string
//   buyerLandmark?: string // Feature #6: Landmark extension
//   buyerGST: string
//   buyerPAN?: string // Feature #9

//   shipToName?: string
//   shipToAddress?: string
//   shipToLandmark?: string // Feature #6
//   shipToGST?: string // Feature #7: Shipping Address Must Have GST Number Field

//   invoiceNumber: string
//   invoiceDate: string
//   paymentTermsType: 'days' | 'custom' // Feature #5
//   paymentTermsDays: number // Feature #5
//   dueDate: string
//   placeOfSupply: string // Feature #2: Valid States Dropdown
//   currency: CurrencyCode
//   notes: string
//   termsAndConditions: string
//   items: InvoiceItem[]
// }

// export interface InvoiceItemCalculated extends InvoiceItem {
//   subtotal: number
//   cgst: number
//   sgst: number
//   igst: number
//   cess: number
//   total: number
// }

// export interface HsnBreakupRow {
//   hsn: string
//   taxableValue: number
//   cgstRate: number
//   cgstAmount: number
//   sgstRate: number
//   sgstAmount: number
//   igstRate: number
//   igstAmount: number
//   cessAmount: number
//   totalTax: number
// }

// export interface InvoiceTotals {
//   subtotal: number
//   totalCGST: number
//   totalSGST: number
//   totalIGST: number
//   totalCess: number
//   totalGST: number
//   grandTotal: number
//   hsnBreakup: HsnBreakupRow[]
// }

// // Feature #4: Fixed high-precision rounding matrix tool
// export function safeRound(value: number, decimals: number = 2): number {
//   return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
// }

// // Feature #1: Validation rule referencing criteria from image_c4bd81.png
// export function validateInvoiceNumber(invNum: string): boolean {
//   const regex = /^[a-zA-Z0-9/-]{1,16}$/;
//   return regex.test(invNum);
// }

// // Feature #9: Validate stand-alone PAN formats explicitly
// export function validatePAN(pan: string): boolean {
//   const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
//   return regex.test(pan.trim().toUpperCase());
// }

// // Feature #9: Native PAN calculation helper extracted from Indian standard GSTIN structures
// export function extractPANFromGST(gstin: string): string {
//   const cleaned = gstin.trim().toUpperCase();
//   if (cleaned.length >= 12) {
//     return cleaned.substring(2, 12);
//   }
//   return '';
// }

// // Feature #2: Statutory State Zone Profiles
// export const INDIAN_STATES = [
//   { value: '01_Jammu_Kashmir', label: '01 - Jammu & Kashmir' },
//   { value: '02_Himachal_Pradesh', label: '02 - Himachal Pradesh' },
//   { value: '03_Punjab', label: '03 - Punjab' },
//   { value: '04_Chandigarh', label: '04 - Chandigarh' },
//   { value: '05_Uttarakhand', label: '05 - Uttarakhand' },
//   { value: '06_Haryana', label: '06 - Haryana' },
//   { value: '07_Delhi', label: '07 - Delhi' },
//   { value: '08_Rajasthan', label: '08 - Rajasthan' },
//   { value: '09_Uttar_Pradesh', label: '09 - Uttar Pradesh' },
//   { value: '10_Bihar', label: '10 - Bihar' },
//   { value: '11_Sikkim', label: '11 - Sikkim' },
//   { value: '12_Arunachal_Pradesh', label: '12 - Arunachal Pradesh' },
//   { value: '13_Nagaland', label: '13 - Nagaland' },
//   { value: '14_Manipur', label: '14 - Manipur' },
//   { value: '15_Mizoram', label: '15 - Mizoram' },
//   { value: '16_Tripura', label: '16 - Tripura' },
//   { value: '17_Meghalaya', label: '17 - Meghalaya' },
//   { value: '18_Assam', label: '18 - Assam' },
//   { value: '19_West_Bengal', label: '19 - West Bengal' },
//   { value: '20_Jharkhand', label: '20 - Jharkhand' },
//   { value: '21_Odisha', label: '21 - Odisha' },
//   { value: '22_Chhattisgarh', label: '22 - Chhattisgarh' },
//   { value: '23_Madhya_Pradesh', label: '23 - Madhya Pradesh' },
//   { value: '24_Gujarat', label: '24 - Gujarat' },
//   { value: '26_Dadra_Nagar_Haveli', label: '26 - Dadra & Nagar Haveli and Daman & Diu' },
//   { value: '27_Maharashtra', label: '27 - Maharashtra' },
//   { value: '29_Karnataka', label: '29 - Karnataka' },
//   { value: '30_Goa', label: '30 - Goa' },
//   { value: '31_Lakshadweep', label: '31 - Lakshadweep' },
//   { value: '32_Kerala', label: '32 - Kerala' },
//   { value: '33_Tamil_Nadu', label: '33 - Tamil Nadu' },
//   { value: '34_Puducherry', label: '34 - Puducherry' },
//   { value: '35_Andaman_Nicobar', label: '35 - Andaman & Nicobar Islands' },
//   { value: '36_Telangana', label: '36 - Telangana' },
//   { value: '37_Andhra_Pradesh', label: '37 - Andhra Pradesh' },
//   { value: '38_Ladakh', label: '38 - Ladakh' }
// ];

// export function calcItem(item: InvoiceItem): InvoiceItemCalculated {
//   const subtotal = item.quantity * item.rate;
//   const gstAmount = (subtotal * item.gstRate) / 100;
//   const cess = (subtotal * item.cessRate) / 100; // Feature #3
  
//   let cgst = 0, sgst = 0, igst = 0;

//   if (item.gstType === 'cgst_sgst') {
//     cgst = gstAmount / 2;
//     sgst = gstAmount / 2;
//   } else if (item.gstType === 'igst') {
//     igst = gstAmount;
//   }

//   const total = subtotal + cgst + sgst + igst + cess;

//   return {
//     ...item,
//     subtotal: safeRound(subtotal),
//     cgst: safeRound(cgst),
//     sgst: safeRound(sgst),
//     igst: safeRound(igst),
//     cess: safeRound(cess),
//     total: safeRound(total)
//   };
// }

// export function calcTotals(items: InvoiceItem[]): InvoiceTotals {
//   let unroundedSubtotal = 0;
//   let unroundedCGST = 0;
//   let unroundedSGST = 0;
//   let unroundedIGST = 0;
//   let unroundedCess = 0;

//   const hsnMap: Record<string, {
//     hsn: string;
//     taxableValue: number;
//     cgstRate: number;
//     cgstAmount: number;
//     sgstRate: number;
//     sgstAmount: number;
//     igstRate: number;
//     igstAmount: number;
//     cessAmount: number;
//   }> = {};

//   items.forEach(item => {
//     const subtotal = item.quantity * item.rate;
//     const gstAmount = (subtotal * item.gstRate) / 100;
//     const cess = (subtotal * item.cessRate) / 100;
//     const code = item.hsn.trim() || '—';

//     unroundedSubtotal += subtotal;
//     unroundedCess += cess;

//     let cgst = 0, sgst = 0, igst = 0;
//     if (item.gstType === 'cgst_sgst') {
//       cgst = gstAmount / 2;
//       sgst = gstAmount / 2;
//       unroundedCGST += cgst;
//       unroundedSGST += sgst;
//     } else if (item.gstType === 'igst') {
//       igst = gstAmount;
//       unroundedIGST += igst;
//     }

//     if (!hsnMap[code]) {
//       hsnMap[code] = {
//         hsn: code,
//         taxableValue: 0,
//         cgstRate: item.gstType === 'cgst_sgst' ? item.gstRate / 2 : 0,
//         cgstAmount: 0,
//         sgstRate: item.gstType === 'cgst_sgst' ? item.gstRate / 2 : 0,
//         sgstAmount: 0,
//         igstRate: item.gstType === 'igst' ? item.gstRate : 0,
//         igstAmount: 0,
//         cessAmount: 0
//       };
//     }

//     hsnMap[code].taxableValue += subtotal;
//     hsnMap[code].cgstAmount += cgst;
//     hsnMap[code].sgstAmount += sgst;
//     hsnMap[code].igstAmount += igst;
//     hsnMap[code].cessAmount += cess;
//   });

//   const hsnBreakup: HsnBreakupRow[] = Object.values(hsnMap).map(row => {
//     const cAmt = safeRound(row.cgstAmount);
//     const sAmt = safeRound(row.sgstAmount);
//     const iAmt = safeRound(row.igstAmount);
//     const cessAmt = safeRound(row.cessAmount);
//     return {
//       ...row,
//       taxableValue: safeRound(row.taxableValue),
//       cgstAmount: cAmt,
//       sgstAmount: sAmt,
//       igstAmount: iAmt,
//       cessAmount: cessAmt,
//       totalTax: safeRound(cAmt + sAmt + iAmt + cessAmt)
//     };
//   });

//   const finalSubtotal = safeRound(unroundedSubtotal);
//   const finalCGST = safeRound(unroundedCGST);
//   const finalSGST = safeRound(unroundedSGST);
//   const finalIGST = safeRound(unroundedIGST);
//   const finalCess = safeRound(unroundedCess);
//   const finalGST = safeRound(finalCGST + finalSGST + finalIGST);
//   const grandTotal = safeRound(finalSubtotal + finalGST + finalCess);

//   return {
//     subtotal: finalSubtotal,
//     totalCGST: finalCGST,
//     totalSGST: finalSGST,
//     totalIGST: finalIGST,
//     totalCess: finalCess,
//     totalGST: finalGST,
//     grandTotal,
//     hsnBreakup
//   };
// }

// export function formatCurrency(amount: number, currency: CurrencyCode = 'INR'): string {
//   const localeMap: Record<CurrencyCode, string> = {
//     INR: 'en-IN', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB'
//   };
//   return new Intl.NumberFormat(localeMap[currency] || 'en-US', {
//     style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
//   }).format(amount);
// }

// export function amountInWords(amount: number, currency: CurrencyCode = 'INR'): string {
//   const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
//     'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
//   const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

//   function convert(n: number): string {
//     if (n < 20) return ones[n];
//     if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
//     if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
//     if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
//     if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
//     return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
//   }

//   const mainUnits = Math.floor(amount);
//   const subUnits = Math.round((amount - mainUnits) * 100);

//   const currencyLabels: Record<CurrencyCode, { main: string; sub: string }> = {
//     INR: { main: 'Rupees', sub: 'Paise' },
//     USD: { main: 'Dollars', sub: 'Cents' },
//     EUR: { main: 'Euros', sub: 'Cents' },
//     GBP: { main: 'Pounds', sub: 'Pence' }
//   };

//   const label = currencyLabels[currency] || { main: 'Units', sub: 'Sub-units' };
//   let words = `${label.main} ` + (mainUnits === 0 ? 'Zero' : convert(mainUnits));
//   if (subUnits > 0) words += ' and ' + convert(subUnits) + ` ${label.sub}`;
//   return words + ' Only';
// }

// // Feature #5: Helper to compute variable offset dates safely
// export function computeOffsetDueDate(baseDateStr: string, days: number): string {
//   if (!baseDateStr) return '';
//   const d = new Date(baseDateStr);
//   d.setDate(d.getDate() + days);
//   return d.toISOString().split('T')[0];
// }

// export function newItem(): InvoiceItem {
//   return {
//     id: Math.random().toString(36).slice(2, 11),
//     description: '',
//     hsn: '',
//     quantity: 1,
//     rate: 0,
//     gstRate: 18,
//     gstType: 'cgst_sgst',
//     cessRate: 0
//   };
// }

// export const DEFAULT_INVOICE: InvoiceData = {
//   sellerName: '',
//   sellerAddress: '',
//   sellerLandmark: '',
//   sellerGST: '',
//   sellerPAN: '',
//   sellerPhone: '',
//   sellerEmail: '',
//   buyerName: '',
//   buyerAddress: '',
//   buyerLandmark: '',
//   buyerGST: '',
//   buyerPAN: '',
//   shipToName: '',
//   shipToAddress: '',
//   shipToLandmark: '',
//   shipToGST: '',
//   invoiceNumber: '',
//   invoiceDate: new Date().toISOString().split('T')[0],
//   paymentTermsType: 'days',
//   paymentTermsDays: 15,
//   dueDate: computeOffsetDueDate(new Date().toISOString().split('T')[0], 15),
//   placeOfSupply: '06_Haryana',
//   currency: 'INR',
//   notes: '',
//   termsAndConditions: 'We declare that the above particulars are true and correct.',
//   items: [newItem()],
// };

// // Re-added to fix your layout components import failure:
// export const GST_RATES = [0, 5, 12, 18, 28];
// export const CESS_RATES = [0, 1, 3, 5, 12, 22];

// export const CURRENCIES: { value: CurrencyCode; label: string }[] = [
//   { value: 'INR', label: '₹ Indian Rupee (INR)' },
//   { value: 'USD', label: '$ US Dollar (USD)' },
//   { value: 'EUR', label: '€ Euro (EUR)' },
//   { value: 'GBP', label: '£ British Pound (GBP)' },
// ];




export type GSTType = 'none' | 'cgst_sgst' | 'igst'
export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP'

export interface InvoiceItem {
  id: string
  description: string
  hsn: string
  quantity: number
  mrp: number        // NEW: Maximum Retail Price
  discRate: number   // NEW: Trade Discount % on MRP
  cdRate: number     // NEW: Cash Discount % applied after trade disc
  rate: number       // Auto-computed: MRP after discRate & cdRate
  gstRate: number
  gstType: GSTType
  cessRate: number
}

export interface InvoiceData {
  sellerName: string
  sellerAddress: string
  sellerLandmark?: string
  sellerGST: string
  sellerPAN?: string
  sellerPhone: string
  sellerEmail: string

  buyerName: string
  buyerAddress: string
  buyerLandmark?: string
  buyerGST: string
  buyerPAN?: string

  shipToName?: string
  shipToAddress?: string
  shipToLandmark?: string
  shipToGST?: string

  invoiceNumber: string
  invoiceDate: string
  paymentTermsType: 'days' | 'custom'
  paymentTermsDays: number
  dueDate: string
  placeOfSupply: string
  currency: CurrencyCode
  notes: string
  termsAndConditions: string
  items: InvoiceItem[]
}

export interface InvoiceItemCalculated extends InvoiceItem {
  effectiveRate: number  // rate after both discounts
  subtotal: number       // qty * effectiveRate (taxable value)
  discAmt: number        // trade discount amount
  cdAmt: number          // cash discount amount
  cgst: number
  sgst: number
  igst: number
  cess: number
  gstAmt: number
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
  cessAmount: number
  totalTax: number
}

export interface InvoiceTotals {
  subtotal: number
  totalDisc: number
  totalCD: number
  totalCGST: number
  totalSGST: number
  totalIGST: number
  totalCess: number
  totalGST: number
  grandTotal: number
  hsnBreakup: HsnBreakupRow[]
}

// Fixed high-precision rounding
export function safeRound(value: number, decimals: number = 2): number {
  return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals)
}

export function validateInvoiceNumber(invNum: string): boolean {
  const regex = /^[a-zA-Z0-9/-]{1,16}$/
  return regex.test(invNum)
}

export function validatePAN(pan: string): boolean {
  const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  return regex.test(pan.trim().toUpperCase())
}

export function extractPANFromGST(gstin: string): string {
  const cleaned = gstin.trim().toUpperCase()
  if (cleaned.length >= 12) return cleaned.substring(2, 12)
  return ''
}

export const INDIAN_STATES = [
  { value: '01_Jammu_Kashmir', label: '01 - Jammu & Kashmir' },
  { value: '02_Himachal_Pradesh', label: '02 - Himachal Pradesh' },
  { value: '03_Punjab', label: '03 - Punjab' },
  { value: '04_Chandigarh', label: '04 - Chandigarh' },
  { value: '05_Uttarakhand', label: '05 - Uttarakhand' },
  { value: '06_Haryana', label: '06 - Haryana' },
  { value: '07_Delhi', label: '07 - Delhi' },
  { value: '08_Rajasthan', label: '08 - Rajasthan' },
  { value: '09_Uttar_Pradesh', label: '09 - Uttar Pradesh' },
  { value: '10_Bihar', label: '10 - Bihar' },
  { value: '11_Sikkim', label: '11 - Sikkim' },
  { value: '12_Arunachal_Pradesh', label: '12 - Arunachal Pradesh' },
  { value: '13_Nagaland', label: '13 - Nagaland' },
  { value: '14_Manipur', label: '14 - Manipur' },
  { value: '15_Mizoram', label: '15 - Mizoram' },
  { value: '16_Tripura', label: '16 - Tripura' },
  { value: '17_Meghalaya', label: '17 - Meghalaya' },
  { value: '18_Assam', label: '18 - Assam' },
  { value: '19_West_Bengal', label: '19 - West Bengal' },
  { value: '20_Jharkhand', label: '20 - Jharkhand' },
  { value: '21_Odisha', label: '21 - Odisha' },
  { value: '22_Chhattisgarh', label: '22 - Chhattisgarh' },
  { value: '23_Madhya_Pradesh', label: '23 - Madhya Pradesh' },
  { value: '24_Gujarat', label: '24 - Gujarat' },
  { value: '26_Dadra_Nagar_Haveli', label: '26 - Dadra & Nagar Haveli and Daman & Diu' },
  { value: '27_Maharashtra', label: '27 - Maharashtra' },
  { value: '29_Karnataka', label: '29 - Karnataka' },
  { value: '30_Goa', label: '30 - Goa' },
  { value: '31_Lakshadweep', label: '31 - Lakshadweep' },
  { value: '32_Kerala', label: '32 - Kerala' },
  { value: '33_Tamil_Nadu', label: '33 - Tamil Nadu' },
  { value: '34_Puducherry', label: '34 - Puducherry' },
  { value: '35_Andaman_Nicobar', label: '35 - Andaman & Nicobar Islands' },
  { value: '36_Telangana', label: '36 - Telangana' },
  { value: '37_Andhra_Pradesh', label: '37 - Andhra Pradesh' },
  { value: '38_Ladakh', label: '38 - Ladakh' },
]

/**
 * Compute effective rate from MRP after trade discount then cash discount.
 * Rate = MRP × (1 - discRate/100) × (1 - cdRate/100)
 */
export function computeEffectiveRate(mrp: number, discRate: number, cdRate: number): number {
  const afterDisc = mrp * (1 - discRate / 100)
  const afterCD   = afterDisc * (1 - cdRate / 100)
  return safeRound(afterCD)
}

export function calcItem(item: InvoiceItem): InvoiceItemCalculated {
  const effectiveRate = computeEffectiveRate(item.mrp, item.discRate, item.cdRate)
  const subtotal      = safeRound(item.quantity * effectiveRate)   // taxable value
  const discAmt       = safeRound(item.quantity * item.mrp * item.discRate / 100)
  const cdAmt         = safeRound(item.quantity * (item.mrp - item.mrp * item.discRate / 100) * item.cdRate / 100)

  const gstBase  = subtotal
  const gstTotal = safeRound((gstBase * item.gstRate) / 100)
  const cess     = safeRound((gstBase * item.cessRate) / 100)

  let cgst = 0, sgst = 0, igst = 0
  if (item.gstType === 'cgst_sgst') {
    cgst = safeRound(gstTotal / 2)
    sgst = safeRound(gstTotal / 2)
  } else if (item.gstType === 'igst') {
    igst = gstTotal
  }

  const gstAmt = cgst + sgst + igst
  const total  = safeRound(subtotal + gstAmt + cess)

  return {
    ...item,
    effectiveRate,
    subtotal,
    discAmt,
    cdAmt,
    cgst,
    sgst,
    igst,
    cess,
    gstAmt,
    total,
  }
}

export function calcTotals(items: InvoiceItem[]): InvoiceTotals {
  let uSubtotal = 0, uCGST = 0, uSGST = 0, uIGST = 0, uCess = 0, uDisc = 0, uCD = 0

  const hsnMap: Record<string, {
    hsn: string; taxableValue: number
    cgstRate: number; cgstAmount: number
    sgstRate: number; sgstAmount: number
    igstRate: number; igstAmount: number
    cessAmount: number
  }> = {}

  items.forEach(item => {
    const c    = calcItem(item)
    const code = item.hsn.trim() || '—'

    uSubtotal += c.subtotal
    uCess     += c.cess
    uDisc     += c.discAmt
    uCD       += c.cdAmt

    if (item.gstType === 'cgst_sgst') { uCGST += c.cgst; uSGST += c.sgst }
    else if (item.gstType === 'igst')  { uIGST += c.igst }

    if (!hsnMap[code]) {
      hsnMap[code] = {
        hsn: code, taxableValue: 0,
        cgstRate:   item.gstType === 'cgst_sgst' ? item.gstRate / 2 : 0,
        cgstAmount: 0,
        sgstRate:   item.gstType === 'cgst_sgst' ? item.gstRate / 2 : 0,
        sgstAmount: 0,
        igstRate:   item.gstType === 'igst' ? item.gstRate : 0,
        igstAmount: 0,
        cessAmount: 0,
      }
    }
    hsnMap[code].taxableValue += c.subtotal
    hsnMap[code].cgstAmount   += c.cgst
    hsnMap[code].sgstAmount   += c.sgst
    hsnMap[code].igstAmount   += c.igst
    hsnMap[code].cessAmount   += c.cess
  })

  const hsnBreakup: HsnBreakupRow[] = Object.values(hsnMap).map(row => {
    const cAmt = safeRound(row.cgstAmount)
    const sAmt = safeRound(row.sgstAmount)
    const iAmt = safeRound(row.igstAmount)
    const cessAmt = safeRound(row.cessAmount)
    return {
      ...row,
      taxableValue: safeRound(row.taxableValue),
      cgstAmount: cAmt, sgstAmount: sAmt,
      igstAmount: iAmt, cessAmount: cessAmt,
      totalTax: safeRound(cAmt + sAmt + iAmt + cessAmt),
    }
  })

  const finalSubtotal = safeRound(uSubtotal)
  const finalCGST     = safeRound(uCGST)
  const finalSGST     = safeRound(uSGST)
  const finalIGST     = safeRound(uIGST)
  const finalCess     = safeRound(uCess)
  const finalGST      = safeRound(finalCGST + finalSGST + finalIGST)
  const grandTotal    = safeRound(finalSubtotal + finalGST + finalCess)

  return {
    subtotal:   finalSubtotal,
    totalDisc:  safeRound(uDisc),
    totalCD:    safeRound(uCD),
    totalCGST:  finalCGST,
    totalSGST:  finalSGST,
    totalIGST:  finalIGST,
    totalCess:  finalCess,
    totalGST:   finalGST,
    grandTotal,
    hsnBreakup,
  }
}

export function formatCurrency(amount: number, currency: CurrencyCode = 'INR'): string {
  const localeMap: Record<CurrencyCode, string> = {
    INR: 'en-IN', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB',
  }
  return new Intl.NumberFormat(localeMap[currency] || 'en-US', {
    style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount)
}

export function amountInWords(amount: number, currency: CurrencyCode = 'INR'): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function convert(n: number): string {
    if (n < 20)       return ones[n]
    if (n < 100)      return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
    if (n < 1000)     return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '')
    if (n < 100000)   return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '')
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '')
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '')
  }

  const mainUnits = Math.floor(amount)
  const subUnits  = Math.round((amount - mainUnits) * 100)
  const currencyLabels: Record<CurrencyCode, { main: string; sub: string }> = {
    INR: { main: 'Rupees', sub: 'Paise' },
    USD: { main: 'Dollars', sub: 'Cents' },
    EUR: { main: 'Euros', sub: 'Cents' },
    GBP: { main: 'Pounds', sub: 'Pence' },
  }
  const label = currencyLabels[currency] || { main: 'Units', sub: 'Sub-units' }
  let words = `${label.main} ` + (mainUnits === 0 ? 'Zero' : convert(mainUnits))
  if (subUnits > 0) words += ' and ' + convert(subUnits) + ` ${label.sub}`
  return words + ' Only'
}

export function computeOffsetDueDate(baseDateStr: string, days: number): string {
  if (!baseDateStr) return ''
  const d = new Date(baseDateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function newItem(): InvoiceItem {
  return {
    id:          Math.random().toString(36).slice(2, 11),
    description: '',
    hsn:         '',
    quantity:    1,
    mrp:         0,
    discRate:    0,
    cdRate:      0,
    rate:        0,   // kept for backward compat; not used in new calcItem
    gstRate:     18,
    gstType:     'cgst_sgst',
    cessRate:    0,
  }
}

export const DEFAULT_INVOICE: InvoiceData = {
  sellerName: '', sellerAddress: '', sellerLandmark: '',
  sellerGST: '', sellerPAN: '', sellerPhone: '', sellerEmail: '',
  buyerName: '', buyerAddress: '', buyerLandmark: '',
  buyerGST: '', buyerPAN: '',
  shipToName: '', shipToAddress: '', shipToLandmark: '', shipToGST: '',
  invoiceNumber: '',
  invoiceDate:   new Date().toISOString().split('T')[0],
  paymentTermsType: 'days',
  paymentTermsDays: 15,
  dueDate:       computeOffsetDueDate(new Date().toISOString().split('T')[0], 15),
  placeOfSupply: '06_Haryana',
  currency:      'INR',
  notes:         '',
  termsAndConditions: 'We declare that the above particulars are true and correct.',
  items: [newItem()],
}

export const GST_RATES  = [0, 5, 12, 18, 28]
export const CESS_RATES = [0, 1, 3, 5, 12, 22]

export const CURRENCIES: { value: CurrencyCode; label: string }[] = [
  { value: 'INR', label: '₹ Indian Rupee (INR)' },
  { value: 'USD', label: '$ US Dollar (USD)'    },
  { value: 'EUR', label: '€ Euro (EUR)'          },
  { value: 'GBP', label: '£ British Pound (GBP)' },
]