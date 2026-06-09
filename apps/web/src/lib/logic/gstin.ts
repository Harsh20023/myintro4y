export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

export const STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman & Diu',
  '26': 'Dadra & Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh (erstwhile)',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other Territory',
  '99': 'Centre Jurisdiction',
}

export interface GSTINParts {
  stateCode: string
  stateName: string
  pan: string
  entityNumber: string
}

export function parseGSTIN(gstin: string): GSTINParts | null {
  const upper = gstin.trim().toUpperCase()
  if (!GSTIN_REGEX.test(upper)) return null
  const stateCode = upper.slice(0, 2)
  return {
    stateCode,
    stateName: STATE_CODES[stateCode] ?? 'Unknown',
    pan: upper.slice(2, 12),
    entityNumber: upper[12],
  }
}

export function validateGSTIN(gstin: string): { valid: boolean; message?: string } {
  const upper = gstin.trim().toUpperCase()
  if (upper.length === 0) return { valid: false }
  if (upper.length < 15) return { valid: false, message: `${15 - upper.length} more character${15 - upper.length > 1 ? 's' : ''} needed` }
  if (upper.length > 15) return { valid: false, message: 'GSTIN must be exactly 15 characters' }
  if (!GSTIN_REGEX.test(upper)) return { valid: false, message: 'Invalid GSTIN format' }
  return { valid: true }
}
