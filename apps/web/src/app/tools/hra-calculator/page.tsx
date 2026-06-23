import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { HRACalculator } from '@/components/tools/HRACalculator'

export const metadata: Metadata = {
  title: 'HRA Exemption Calculator — Conceptra',
  description: 'Calculate your exact HRA exemption u/s 10(13A). Shows all three components and which is the minimum.',
}

export default function Page() {
  return (
    <ToolLayout
      title="HRA Exemption Calculator"
      description="Calculate your exact HRA exemption u/s 10(13A). Shows all three components — pick the minimum."
      breadcrumb="HRA Exemption Calculator"
      relatedTools={[
        { label: 'Income Tax Calculator', href: '/tools/income-tax-calculator' },
        { label: 'Section 80C Planner',   href: '/tools/section-80c-planner' },
        { label: 'In-Hand Salary',        href: '/tools/in-hand-salary-calculator' },
      ]}
    >
      <HRACalculator />
    </ToolLayout>
  )
}
