import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { GSTFilingChecker } from '@/components/tools/GSTFilingChecker'
import { ToolGate } from '@/components/tools/ToolGate'

export const metadata: Metadata = {
  title: 'GST Filing Status Checker — Check GSTR-1 & GSTR-3B Filing History',
  description: 'Check GST filing status for any GSTIN. View GSTR-1 and GSTR-3B filing history year-wise, and return filing frequency directly from the GSTN portal.',
  keywords: ['GST filing status', 'GSTR-1 filed', 'GSTR-3B status', 'GST return history', 'filing frequency checker'],
}

export default function GSTFilingCheckerPage() {
  return (
    <ToolLayout
      title="GST Filing Checker"
      description="Check GSTR-1 and GSTR-3B filing history for any GSTIN, year-wise. View return filing frequency directly from the GSTN portal."
      breadcrumb="GST Filing Checker"
      badge="Free"
      relatedTools={[
        { label: 'GSTIN Checker',            href: '/tools/gst-number-checker' },
        { label: 'GST Late Fee Calculator',  href: '/tools/gst-late-fee-calculator' },
        { label: 'GSTR-1 Downloader',        href: '/tools/gst-return-downloader' },
      ]}
    >
      <ToolGate><GSTFilingChecker /></ToolGate>
    </ToolLayout>
  )
}
