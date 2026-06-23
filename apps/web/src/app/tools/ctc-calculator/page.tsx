import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { ComingSoonTool } from '@/components/tools/ComingSoonTool'

export const metadata: Metadata = {
  title: 'CTC Breakup Calculator — Conceptra',
  description: 'Break down your CTC into in-hand salary, PF, gratuity, and tax liability.',
}

export default function Page() {
  return (
    <ToolLayout title="CTC Breakup Calculator" description="Break down your CTC into in-hand salary, PF, gratuity, and tax liability." breadcrumb="CTC Breakup Calculator" badge="Coming Soon">
      <ComingSoonTool title="CTC Breakup Calculator" description="Break down your CTC into in-hand salary, PF, gratuity, and tax liability." category="Salary & CTC" />
    </ToolLayout>
  )
}
