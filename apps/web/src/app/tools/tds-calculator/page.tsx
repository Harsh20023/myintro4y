import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { TDSCalculator } from '@/components/tools/TDSCalculator'

export const metadata: Metadata = {
  title: 'TDS Calculator — Conceptra',
  description: 'Calculate TDS on salary, professional fees, rent, and contractor payments.',
}

export default function Page() {
  return (
    <ToolLayout title="TDS Calculator" description="Calculate TDS on salary, professional fees, rent, and contractor payments." breadcrumb="TDS Calculator">
      <TDSCalculator />
    </ToolLayout>
  )
}
