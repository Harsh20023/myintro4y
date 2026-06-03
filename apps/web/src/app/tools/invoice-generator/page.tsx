import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { InvoiceGenerator } from '@/components/tools/InvoiceGenerator'

export const metadata: Metadata = {
  title: 'Free Invoice Generator — GST Invoice Online',
  description: 'Create professional GST invoices online for free. Add CGST, SGST or IGST, download as PDF. No sign-up required.',
  keywords: ['invoice generator', 'GST invoice', 'free invoice maker', 'India invoice', 'tax invoice online'],
}

export default function InvoiceGeneratorPage() {
  return (
    <ToolLayout
      title="Invoice Generator"
      description="Create professional GST-compliant invoices in seconds. Download as PDF, print, or share."
      breadcrumb="Invoice Generator"
      badge="Free"
      relatedTools={[{ label: 'GST Calculator', href: '/tools/gst-calculator' }]}
    >
      <InvoiceGenerator />

      {/* SEO content */}
      <div className="mt-16 max-w-2xl">
        <h2 className="font-display font-bold text-xl text-ink-900 mb-4">Free GST Invoice Generator for Indian Businesses</h2>
        <div className="prose prose-sm text-ink-500 space-y-3">
          <p>Generate professional tax invoices compliant with Indian GST regulations. Supports both intra-state (CGST + SGST) and inter-state (IGST) transactions.</p>
          <p>All GST slabs supported: 0%, 5%, 12%, 18%, and 28%. Download your invoice as a PDF or print directly from your browser — no account required.</p>
          <h3 className="text-ink-700 font-semibold mt-4">What's included</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>GSTIN fields for both seller and buyer</li>
            <li>Automatic CGST/SGST and IGST calculation</li>
            <li>Multiple line items with per-item GST rates</li>
            <li>Amount in words (Indian numbering system)</li>
            <li>PDF download with professional formatting</li>
          </ul>
        </div>
      </div>
    </ToolLayout>
  )
}
