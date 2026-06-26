import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ThemeWrapper from './components/ThemeWrapper';
import ThemeSwitcher from './components/ThemeSwitcher';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatbotWidget from './components/ChatbotWidget';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://conceptra.co.in'),
  title: 'Conceptra Advisory LLP | Financial Management, Audit & Startup Advisory',
  description:
    'Professionally managed organization providing cost-effective Financial Management, Accounting, Auditing, Company Formation, and Payroll solutions tailored to your business needs.',
  keywords: [
    'Conceptra Advisory LLP',
    'Financial Management Services',
    'Accounting Auditing Services',
    'Company Formation India',
    'Payroll Services',
    'Startup Advisory Gurugram',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        <ThemeWrapper>
          <ThemeSwitcher />
          <Navbar />
          <main>{children}</main>
          <Footer />
<ChatbotWidget />
        </ThemeWrapper>
      </body>
    </html>
  );
}
