import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { ComingSoonTool } from '@/components/tools/ComingSoonTool'

export const metadata: Metadata = {
  title: 'ITR Filing Status — Conceptra',
  description: 'Check the processing status of your filed ITR using PAN and assessment year.',
}

export default function Page() {
  return (
    <ToolLayout title="ITR Filing Status" description="Check the processing status of your filed ITR using PAN and assessment year." breadcrumb="ITR Filing Status" badge="Coming Soon">
      <ComingSoonTool title="ITR Filing Status" description="Check the processing status of your filed ITR using PAN and assessment year." category="ITR Filing" />
    </ToolLayout>
  )
}
