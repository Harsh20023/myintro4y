import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { ComingSoonTool } from '@/components/tools/ComingSoonTool'

export const metadata: Metadata = {
  title: 'Home Loan Tax Benefit — Conceptra',
  description: 'Calculate deductions under Section 24(b) and 80C on home loan interest and principal.',
}

export default function Page() {
  return (
    <ToolLayout title="Home Loan Tax Benefit" description="Calculate deductions under Section 24(b) and 80C on home loan interest and principal." breadcrumb="Home Loan Tax Benefit" badge="Coming Soon">
      <ComingSoonTool title="Home Loan Tax Benefit" description="Calculate deductions under Section 24(b) and 80C on home loan interest and principal." category="Deductions & Savings" />
    </ToolLayout>
  )
}
