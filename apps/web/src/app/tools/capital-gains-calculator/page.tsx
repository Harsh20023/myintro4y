import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { CapitalGainsCalculator } from '@/components/tools/CapitalGainsCalculator'

export const metadata: Metadata = {
  title: 'Capital Gains Calculator — Conceptra',
  description: 'Calculate STCG and LTCG tax on stocks, mutual funds, and property sales.',
}

export default function Page() {
  return (
    <ToolLayout title="Capital Gains Calculator" description="Calculate STCG and LTCG tax on stocks, mutual funds, and property sales." breadcrumb="Capital Gains Calculator">
      <CapitalGainsCalculator />
    </ToolLayout>
  )
}
