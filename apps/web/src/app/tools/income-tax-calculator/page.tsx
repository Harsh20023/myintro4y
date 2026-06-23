import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { IncomeTaxCalculator } from '@/components/tools/IncomeTaxCalculator'

export const metadata: Metadata = {
  title: 'Income Tax Calculator — Conceptra',
  description: 'Compare old vs new tax regime and calculate your exact tax liability. Supports FY 2024-25 and FY 2025-26 with slab-wise breakdown.',
}

export default function Page() {
  return (
    <ToolLayout
      title="Income Tax Calculator"
      description="Compare Old Regime vs New Regime instantly. Covers FY 2024-25 and FY 2025-26 with full slab-wise breakdown."
      breadcrumb="Income Tax Calculator"
      relatedTools={[
        { label: 'TDS Calculator', href: '/tools/tds-calculator' },
        { label: 'HRA Calculator', href: '/tools/hra-calculator' },
        { label: 'Section 80C Planner', href: '/tools/section-80c-planner' },
      ]}
    >
      <IncomeTaxCalculator />
    </ToolLayout>
  )
}
