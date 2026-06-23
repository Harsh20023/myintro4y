import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { ComingSoonTool } from '@/components/tools/ComingSoonTool'

export const metadata: Metadata = {
  title: 'TIS Viewer — Conceptra',
  description: 'View your Taxpayer Information Summary — a clean category-wise digest of your AIS data.',
}

export default function Page() {
  return (
    <ToolLayout title="TIS Viewer" description="View your Taxpayer Information Summary — a clean category-wise digest of your AIS data." breadcrumb="TIS Viewer" badge="Coming Soon">
      <ComingSoonTool title="TIS Viewer" description="View your Taxpayer Information Summary — a clean category-wise digest of your AIS data." category="Documents & Statements" />
    </ToolLayout>
  )
}
