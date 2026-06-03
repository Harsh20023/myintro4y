import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

interface ToolLayoutProps {
  children: React.ReactNode
  title: string
  description: string
  breadcrumb: string
  badge?: string
  relatedTools?: { label: string; href: string }[]
}

export function ToolLayout({
  children,
  title,
  description,
  breadcrumb,
  badge,
  relatedTools = [],
}: ToolLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Tool header */}
        <div className="bg-white border-b border-ink-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-ink-400 mb-4">
              <Link href="/" className="hover:text-ink-600 transition-colors">Home</Link>
              <ChevronRight size={12} />
              <Link href="/#tools" className="hover:text-ink-600 transition-colors">Tools</Link>
              <ChevronRight size={12} />
              <span className="text-ink-600">{breadcrumb}</span>
            </nav>

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="font-display font-bold text-2xl md:text-3xl text-ink-900">{title}</h1>
                  {badge && (
                    <span className="px-2 py-0.5 bg-brand-50 text-brand-700 text-xs font-medium rounded-full border border-brand-100">
                      {badge}
                    </span>
                  )}
                </div>
                <p className="text-ink-500 text-sm max-w-xl">{description}</p>
              </div>

              {relatedTools.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-ink-400 self-center">Related:</span>
                  {relatedTools.map(t => (
                    <Link key={t.href} href={t.href} className="btn-ghost text-xs px-3 py-1.5 border border-ink-200 rounded-lg">
                      {t.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tool content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  )
}
