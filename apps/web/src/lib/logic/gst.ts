// Pure GST calculation logic

export type GSTCalcMode = 'exclusive' | 'inclusive'
export type TransactionType = 'intra' | 'inter'

export interface GSTResult {
  baseAmount:    number
  cgst:          number
  sgst:          number
  igst:          number
  totalGST:      number
  totalAmount:   number
  gstRate:       number
  transactionType: TransactionType
}

export function calcGST(
  amount: number,
  gstRate: number,
  mode: GSTCalcMode,
  transactionType: TransactionType
): GSTResult {
  let baseAmount: number
  let totalGST: number

  if (mode === 'exclusive') {
    baseAmount = amount
    totalGST   = (amount * gstRate) / 100
  } else {
    // Inclusive: extract GST from the amount
    baseAmount = (amount * 100) / (100 + gstRate)
    totalGST   = amount - baseAmount
  }

  const cgst = transactionType === 'intra' ? totalGST / 2 : 0
  const sgst = transactionType === 'intra' ? totalGST / 2 : 0
  const igst = transactionType === 'inter' ? totalGST : 0

  return {
    baseAmount:  round2(baseAmount),
    cgst:        round2(cgst),
    sgst:        round2(sgst),
    igst:        round2(igst),
    totalGST:    round2(totalGST),
    totalAmount: round2(baseAmount + totalGST),
    gstRate,
    transactionType,
  }
}

export function reverseGST(totalAmount: number, gstRate: number): number {
  return round2((totalAmount * 100) / (100 + gstRate))
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export const GST_SLABS = [
  { value: 0,   label: '0% (Exempt)' },
  { value: 5,   label: '5%' },
  { value: 12,  label: '12%' },
  { value: 18,  label: '18%' },
  { value: 28,  label: '28%' },
]
