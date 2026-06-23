import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { AdvanceTaxCalculator } from '@/components/tools/AdvanceTaxCalculator'

export const metadata: Metadata = {
  title: 'Advance Tax Calculator — Conceptra',
  description: 'Calculate your advance tax instalments for each quarter. Shows exact amounts after TDS credit for June, September, December and March.',
}

export default function Page() {
  return (
    <ToolLayout
      title="Advance Tax Calculator"
      description="Calculate your quarterly advance tax instalments. Enter estimated income and TDS to see exactly what to pay by each due date."
      breadcrumb="Advance Tax Calculator"
      relatedTools={[
        { label: 'Income Tax Calculator', href: '/tools/income-tax-calculator' },
        { label: 'In-Hand Salary',        href: '/tools/in-hand-salary-calculator' },
        { label: 'TDS Calculator',        href: '/tools/tds-calculator' },
      ]}
    >
      <AdvanceTaxCalculator />
    </ToolLayout>
  )
}
