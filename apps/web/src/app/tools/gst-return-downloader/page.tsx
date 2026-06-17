import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { GSTReturnDownloader } from '@/components/tools/GSTReturnDownloader'
import { ToolGate } from '@/components/tools/ToolGate'

export const metadata: Metadata = {
  title: 'GST Return Downloader — Download GSTR-1, GSTR-3B, GSTR-2A, GSTR-2B',
  description: 'Login to the GST portal and bulk download filed GST returns — GSTR-1, GSTR-3B, GSTR-2A, GSTR-2B — for any period. Supports Excel and PDF formats.',
}

export default function GSTReturnDownloaderPage() {
  return (
    <ToolLayout
      title="GST Return Downloader"
      description="Download GSTR-1, GSTR-3B, GSTR-2A or GSTR-2B for any period. Bulk download across months and years."
      breadcrumb="GST Return Downloader"
      badge="Beta"
      relatedTools={[
        { label: 'GSTIN Checker', href: '/tools/gst-number-checker' },
        { label: 'GST Calculator', href: '/tools/gst-calculator' },
        { label: 'GST Late Fee Calculator', href: '/tools/gst-late-fee-calculator' },
      ]}
    >
      <ToolGate><GSTReturnDownloader /></ToolGate>
    </ToolLayout>
  )
}
