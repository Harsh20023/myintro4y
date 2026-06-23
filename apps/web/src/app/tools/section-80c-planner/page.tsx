import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { Section80CPlanner } from '@/components/tools/Section80CPlanner'

export const metadata: Metadata = {
  title: 'Section 80C Planner — Conceptra',
  description: 'Plan your ₹1,50,000 Section 80C investments across PPF, ELSS, LIC, NSC, EPF and more. See utilisation and suggestions.',
}

export default function Page() {
  return (
    <ToolLayout
      title="Section 80C Planner"
      description="Track and plan your ₹1,50,000 Section 80C investments. See what you've used and what's still available."
      breadcrumb="Section 80C Planner"
      relatedTools={[
        { label: 'Income Tax Calculator', href: '/tools/income-tax-calculator' },
        { label: 'HRA Calculator',        href: '/tools/hra-calculator' },
        { label: 'In-Hand Salary',        href: '/tools/in-hand-salary-calculator' },
      ]}
    >
      <Section80CPlanner />
    </ToolLayout>
  )
}
