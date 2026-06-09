import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { GSTNumberChecker } from '@/components/tools/GSTNumberChecker'
import { ToolGate } from '@/components/tools/ToolGate'

export const metadata: Metadata = {
  title: 'Free GSTIN Checker India — Verify GST Number Instantly',
  description: 'Verify any GSTIN for free. Check if a GST number is valid, view business name, taxpayer type, registration date, and filing status directly from the GSTN portal.',
  keywords: ['GSTIN checker', 'GST number verification', 'verify GST number India', 'GSTN search', 'GST number validity'],
}

export default function GSTNumberCheckerPage() {
  return (
    <ToolLayout
      title="GSTIN Checker"
      description="Verify any GST number live from the GSTN portal. See business name, registration status, taxpayer type, and jurisdiction."
      breadcrumb="GSTIN Checker"
      badge="Free"
      relatedTools={[
        { label: 'GST Calculator', href: '/tools/gst-calculator' },
        { label: 'GST Late Fee Calculator', href: '/tools/gst-late-fee-calculator' },
        { label: 'Invoice Generator', href: '/tools/invoice-generator' },
      ]}
    >
      <ToolGate><GSTNumberChecker /></ToolGate>

      {/* SEO content */}
      <div className="mt-16 max-w-2xl">
        <h2 className="font-display font-bold text-xl text-ink-900 mb-4">GSTIN Verification — How It Works</h2>
        <div className="prose prose-sm text-ink-500 space-y-3">
          <p>
            A GSTIN (Goods and Services Tax Identification Number) is a unique 15-character identifier assigned to every GST-registered taxpayer in India. This tool verifies any GSTIN directly against the Government's GSTN portal in real time.
          </p>
          <h3 className="text-ink-700 font-semibold mt-4">Understanding a GSTIN</h3>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>First 2 digits</strong> — State code (e.g. 27 = Maharashtra, 07 = Delhi)</li>
            <li><strong>Next 10 characters</strong> — PAN of the taxpayer</li>
            <li><strong>13th character</strong> — Entity number (1–9, A–Z for multiple registrations)</li>
            <li><strong>14th character</strong> — Always &quot;Z&quot;</li>
            <li><strong>15th character</strong> — Checksum digit</li>
          </ul>
          <h3 className="text-ink-700 font-semibold mt-4">What You Can Check</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Whether the GSTIN is active or cancelled</li>
            <li>Registered legal and trade name of the business</li>
            <li>State jurisdiction and registered address</li>
            <li>Taxpayer category (Regular, Composition, etc.)</li>
            <li>Date of GST registration</li>
            <li>Nature of business activities</li>
            <li>e-Invoice eligibility status</li>
          </ul>
        </div>
      </div>
    </ToolLayout>
  )
}
