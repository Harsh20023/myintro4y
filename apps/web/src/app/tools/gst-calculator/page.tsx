import type { Metadata } from 'next'
import { ToolLayout } from '@/components/layout/ToolLayout'
import { GSTCalculator } from '@/components/tools/GSTCalculator'
import { ToolGate } from '@/components/tools/ToolGate'

export const metadata: Metadata = {
  title: 'GST Calculator India — Calculate CGST, SGST, IGST Free',
  description: 'Free GST calculator for Indian businesses. Calculate GST exclusive or inclusive, CGST+SGST for intra-state or IGST for inter-state transactions.',
  keywords: ['GST calculator', 'CGST SGST calculator', 'IGST calculator', 'India GST 2024', 'tax calculator India'],
}

export default function GSTCalculatorPage() {
  return (
    <ToolLayout
      title="GST Calculator"
      description="Calculate GST instantly. Supports all slabs — 5%, 12%, 18%, 28%. CGST+SGST or IGST."
      breadcrumb="GST Calculator"
      badge="Free"
      // relatedTools={[{ label: 'Invoice Generator', href: '/tools/invoice-generator' }]}
      relatedTools={[
        { label: 'Invoice Generator',    href: '/tools/invoice-generator' },
        { label: 'GST Late Fee Calculator', href: '/tools/gst-late-fee-calculator' },
      ]}
    >
      <ToolGate><GSTCalculator /></ToolGate>

      {/* SEO content */}
      <div className="mt-16 max-w-2xl">
        <h2 className="font-display font-bold text-xl text-ink-900 mb-4">GST Calculator for India</h2>
        <div className="prose prose-sm text-ink-500 space-y-3">
          <p>Calculate Goods and Services Tax (GST) for any amount across all tax slabs. Handles both exclusive calculation (adding GST on top) and inclusive calculation (extracting GST from a total).</p>
          <h3 className="text-ink-700 font-semibold mt-4">GST Slabs in India</h3>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>0%</strong> — Essential goods, unbranded food items</li>
            <li><strong>5%</strong> — Basic necessities, household goods</li>
            <li><strong>12%</strong> — Processed foods, business class air travel</li>
            <li><strong>18%</strong> — Most services, electronics, most goods</li>
            <li><strong>28%</strong> — Luxury goods, tobacco, automobiles</li>
          </ul>
        </div>
      </div>
    </ToolLayout>
  )
}
