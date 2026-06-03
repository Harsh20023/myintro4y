import Link from 'next/link'
import { Zap } from 'lucide-react'

const tools = [
  { label: 'Invoice Generator', href: '/tools/invoice-generator' },
  { label: 'GST Calculator',    href: '/tools/gst-calculator' },
]

export function Footer() {
  return (
    <footer className="bg-ink-950 text-ink-400 mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-white font-display font-bold text-base mb-3">
              <span className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
                <Zap size={12} className="text-white" strokeWidth={2.5} />
              </span>
              LedgerHQ
            </Link>
            <p className="text-sm leading-relaxed">Free business tools for Indian SMBs. No sign-up needed.</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-ink-500 mb-3">Free Tools</p>
            <ul className="space-y-2">
              {tools.map(t => (
                <li key={t.href}>
                  <Link href={t.href} className="text-sm hover:text-white transition-colors">{t.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-ink-500 mb-3">Company</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about"   className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-ink-500 mb-3">Legal</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms"   className="hover:text-white transition-colors">Terms of Use</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-ink-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs">© {new Date().getFullYear()} LedgerHQ. Made in India 🇮🇳</p>
          <p className="text-xs">GST-compliant tools for Indian businesses</p>
        </div>
      </div>
    </footer>
  )
}
