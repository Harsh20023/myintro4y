import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { ComingSoonTool } from '@/components/tools/ComingSoonTool'

export const metadata: Metadata = {
  title: 'Tax Savings Calculator — Conceptra',
  description: 'Find how much tax you can save by optimising deductions across all sections.',
}

export default function Page() {
  return (
    <ToolLayout title="Tax Savings Calculator" description="Find how much tax you can save by optimising deductions across all sections." breadcrumb="Tax Savings Calculator" badge="Coming Soon">
      <ComingSoonTool title="Tax Savings Calculator" description="Find how much tax you can save by optimising deductions across all sections." category="Deductions & Savings" />
    </ToolLayout>
  )
}
