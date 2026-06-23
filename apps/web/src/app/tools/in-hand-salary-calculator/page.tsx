import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { InHandSalaryCalculator } from '@/components/tools/InHandSalaryCalculator'

export const metadata: Metadata = {
  title: 'In-Hand Salary Calculator — Conceptra',
  description: 'Enter your CTC and see the full salary structure — basic, HRA, PF, professional tax, TDS — and your exact monthly take-home.',
}

export default function Page() {
  return (
    <ToolLayout
      title="In-Hand Salary Calculator"
      description="Enter your CTC and instantly see your monthly take-home after PF, professional tax, and income tax (TDS)."
      breadcrumb="In-Hand Salary Calculator"
      relatedTools={[
        { label: 'Income Tax Calculator', href: '/tools/income-tax-calculator' },
        { label: 'HRA Calculator',        href: '/tools/hra-calculator' },
        { label: 'Section 80C Planner',   href: '/tools/section-80c-planner' },
      ]}
    >
      <InHandSalaryCalculator />
    </ToolLayout>
  )
}
