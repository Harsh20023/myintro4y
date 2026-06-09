import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { GSTLateFeeCalculator } from '@/components/tools/GSTLateFeeCalculator'
import { ToolGate } from '@/components/tools/ToolGate'

export const metadata: Metadata = {
  title: 'GST Late Fee & Interest Calculator India — Free',
  description: 'Calculate exact GST late fees and interest for GSTR-3B, GSTR-1, GSTR-9 delayed filings. CGST, SGST breakdown. Section 50 interest calculator.',
  keywords: ['GST late fee calculator', 'GSTR-3B penalty', 'GST interest calculator', 'GSTR-1 late fee', 'Section 50 CGST'],
}

export default function GSTLateFeePage() {
  return (
    <ToolLayout
      title="GST Late Fee & Interest Calculator"
      description="Calculate penalties on delayed GST filings. Covers all return types — CGST, SGST breakdown with statutory caps."
      breadcrumb="GST Late Fee Calculator"
      badge="Free"
      relatedTools={[
        { label: 'GST Calculator',    href: '/tools/gst-calculator' },
        { label: 'Invoice Generator', href: '/tools/invoice-generator' },
      ]}
    >
      <ToolGate><GSTLateFeeCalculator /></ToolGate>
    </ToolLayout>
  )
}
