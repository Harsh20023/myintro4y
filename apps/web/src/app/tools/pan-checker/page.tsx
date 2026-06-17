import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { PANChecker } from '@/components/tools/PANChecker'
import { ToolGate } from '@/components/tools/ToolGate'

export const metadata: Metadata = {
  title: 'Search by PAN — Find All GSTINs Linked to a PAN',
  description: 'Find all GSTIN registrations linked to a PAN number directly from the GSTN portal. View status and state for each registration.',
  keywords: ['search by PAN', 'GSTIN by PAN', 'PAN to GSTIN', 'GST registration lookup', 'find GSTIN'],
}

export default function PANCheckerPage() {
  return (
    <ToolLayout
      title="Search by PAN"
      description="Find all GST registrations linked to a PAN number. Live data from the GSTN portal."
      breadcrumb="Search by PAN"
      badge="Free"
      relatedTools={[
        { label: 'GSTIN Checker',       href: '/tools/gst-number-checker' },
        { label: 'GST Filing Checker',  href: '/tools/gst-filing-checker' },
        { label: 'GST Calculator',      href: '/tools/gst-calculator' },
      ]}
    >
      <ToolGate><PANChecker /></ToolGate>
    </ToolLayout>
  )
}
