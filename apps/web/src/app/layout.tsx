import type { Metadata } from 'next'
import '../styles/globals.css'
import { AuthProvider } from '@/lib/AuthContext'

export const metadata: Metadata = {
  title: {
    default: 'Conceptra — Free Business Tools for Indian SMBs',
    template: '%s | Conceptra',
  },
  description: 'Free invoice generator, GST calculator, salary calculator and more. Built for Indian businesses.',
  keywords: ['invoice generator', 'GST calculator', 'free business tools', 'India', 'SMB'],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://Conceptra.in',
    siteName: 'Conceptra',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  )
}
