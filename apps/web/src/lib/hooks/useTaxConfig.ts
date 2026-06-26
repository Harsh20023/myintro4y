'use client'

import { useState, useEffect } from 'react'
import type { TDSSectionMeta } from '@/lib/logic/tds'
import type { IncomeTaxOverride } from '@/lib/logic/tds'

// Shape of the compiled config returned by GET /tax-config/latest
export interface FrontendTaxConfig {
  tax_year:    string
  compiled_at: string
  version:     string
  income_tax:  IncomeTaxOverride & {
    rebate_87a?: {
      new: { max_rebate: number; income_threshold: number }
      old: { max_rebate: number; income_threshold: number }
    }
    std_deduction?: { new: number; old: number }
  }
  tds_sections: TDSSectionMeta[]
}

// Module-level cache so we only fetch once per browser session
let _cache: FrontendTaxConfig | null = null

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://gstapi.conceptra.co.in'

export function useTaxConfig() {
  const [config, setConfig] = useState<FrontendTaxConfig | null>(_cache)

  useEffect(() => {
    if (_cache) return
    fetch(`${BASE}/tax-config/latest`)
      .then(r => (r.ok ? r.json() : null))
      .then((doc: { data?: FrontendTaxConfig } | null) => {
        if (doc?.data) {
          // Build IncomeTaxOverride from the nested income_tax object
          const it = doc.data.income_tax as any
          const override: IncomeTaxOverride = {
            slabs:        it?.slabs,
            stdDeduction: it?.std_deduction,
            rebate87A:    it?.rebate_87a,
            surcharge:    it?.surcharge,
          }
          _cache = { ...doc.data, income_tax: { ...it, ...override } }
          setConfig(_cache)
        }
      })
      .catch(() => {/* network error — fall back to hardcoded */})
  }, [])

  return config
}
