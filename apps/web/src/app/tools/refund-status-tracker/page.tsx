import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { ComingSoonTool } from '@/components/tools/ComingSoonTool'

export const metadata: Metadata = {
  title: 'Refund Status Tracker — Conceptra',
  description: 'Track your income tax refund status directly from the IT department portal.',
}

export default function Page() {
  return (
    <ToolLayout title="Refund Status Tracker" description="Track your income tax refund status directly from the IT department portal." breadcrumb="Refund Status Tracker" badge="Coming Soon">
      <ComingSoonTool title="Refund Status Tracker" description="Track your income tax refund status directly from the IT department portal." category="ITR Filing" />
    </ToolLayout>
  )
}
