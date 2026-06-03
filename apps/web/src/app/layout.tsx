import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'LedgerHQ — Free Business Tools for Indian SMBs',
    template: '%s | LedgerHQ',
  },
  description: 'Free invoice generator, GST calculator, salary calculator and more. Built for Indian businesses.',
  keywords: ['invoice generator', 'GST calculator', 'free business tools', 'India', 'SMB'],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://LedgerHQ.in',
    siteName: 'LedgerHQ',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
