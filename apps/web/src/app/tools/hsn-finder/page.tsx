import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { HsnFinder } from '@/components/tools/HsnFinder'
import { ToolGate } from '@/components/tools/ToolGate'

export const metadata: Metadata = {
  title: 'HSN / SAC Code Finder — Search GST Codes Free | Conceptra',
  description: 'Look up HSN codes for goods and SAC codes for services under GST India. Search by code number or description keyword. Free tool for businesses and CA professionals.',
  keywords: ['HSN code finder', 'SAC code search', 'GST HSN code India', 'SAC code list', 'HSN code lookup', 'goods services code GST'],
}

export default function HsnFinderPage() {
  return (
    <ToolLayout
      title="HSN / SAC Code Finder"
      description="Find Harmonised System Nomenclature (HSN) codes for goods and Services Accounting Codes (SAC) for services. Search by code or description."
      breadcrumb="HSN / SAC Finder"
      badge="Free"
      relatedTools={[
        { label: 'GST Calculator',          href: '/tools/gst-calculator' },
        { label: 'Invoice Generator',       href: '/tools/invoice-generator' },
        { label: 'GSTIN Checker',           href: '/tools/gst-number-checker' },
      ]}
    >
      <ToolGate>
        <HsnFinder />
      </ToolGate>

      {/* SEO content */}
      <div className="mt-16 max-w-2xl">
        <h2 className="font-display font-bold text-xl text-ink-900 mb-4">
          What are HSN and SAC Codes?
        </h2>
        <div className="space-y-3 text-sm text-ink-500 leading-relaxed">
          <p>
            <strong className="text-ink-700">HSN (Harmonised System Nomenclature)</strong> is a 4–8 digit code
            used to classify goods under GST, based on the international World Customs Organisation (WCO) system
            used in over 200 countries.
          </p>
          <p>
            <strong className="text-ink-700">SAC (Services Accounting Code)</strong> is a 6-digit code used to
            classify services under GST, developed by the Central Board of Indirect Taxes and Customs (CBIC).
          </p>

          <h3 className="text-ink-700 font-semibold mt-5 mb-2">Who must mention HSN codes on invoices?</h3>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>Annual turnover <strong>&gt; ₹5 crore</strong> — mandatory 8-digit HSN on all invoices</li>
            <li>Annual turnover <strong>₹1.5–5 crore</strong> — 4-digit HSN mandatory on B2B invoices</li>
            <li>Annual turnover <strong>&lt; ₹1.5 crore</strong> — HSN optional on B2C; mandatory on B2B</li>
          </ul>

          <h3 className="text-ink-700 font-semibold mt-5 mb-2">HSN code structure</h3>
          <ul className="space-y-1.5 list-disc list-inside">
            <li><strong>2 digits</strong> — Chapter (e.g. Chapter 01 = Live Animals)</li>
            <li><strong>4 digits</strong> — Heading (e.g. 0101 = Live horses, asses, mules)</li>
            <li><strong>6 digits</strong> — Sub-heading</li>
            <li><strong>8 digits</strong> — Tariff item (most specific, used for customs)</li>
          </ul>
        </div>
      </div>
    </ToolLayout>
  )
}
