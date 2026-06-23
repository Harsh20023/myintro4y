import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { ComingSoonTool } from '@/components/tools/ComingSoonTool'

export const metadata: Metadata = {
  title: 'Form 26AS Analyser — Conceptra',
  description: 'Parse your Form 26AS to check all TDS credits and advance tax paid against your PAN.',
}

export default function Page() {
  return (
    <ToolLayout title="Form 26AS Analyser" description="Parse your Form 26AS to check all TDS credits and advance tax paid against your PAN." breadcrumb="Form 26AS Analyser" badge="Coming Soon">
      <ComingSoonTool title="Form 26AS Analyser" description="Parse your Form 26AS to check all TDS credits and advance tax paid against your PAN." category="Documents & Statements" />
    </ToolLayout>
  )
}
