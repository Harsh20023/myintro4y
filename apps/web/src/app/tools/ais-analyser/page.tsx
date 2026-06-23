import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { ComingSoonTool } from '@/components/tools/ComingSoonTool'

export const metadata: Metadata = {
  title: 'AIS Analyser — Conceptra',
  description: 'Analyse your Annual Information Statement — stocks, MF, dividends, interest, property and more.',
}

export default function Page() {
  return (
    <ToolLayout title="AIS Analyser" description="Analyse your Annual Information Statement — stocks, MF, dividends, interest, property and more." breadcrumb="AIS Analyser" badge="Coming Soon">
      <ComingSoonTool title="AIS Analyser" description="Analyse your Annual Information Statement — stocks, MF, dividends, interest, property and more." category="Documents & Statements" />
    </ToolLayout>
  )
}
