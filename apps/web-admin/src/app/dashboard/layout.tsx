'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/api'
import { LayoutDashboard, Globe, FileText, Receipt, LogOut, ChevronDown } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/public-access', label: 'Public Access', icon: Globe },
]

const tdsItems = [
  { href: '/dashboard/tds/codes',      label: 'Codes' },
  { href: '/dashboard/tds/code-years', label: 'Code Years' },
  { href: '/dashboard/tds/schedules',  label: 'Schedules' },
]

const gstItems = [
  { href: '/dashboard/gst/rule-sets', label: 'Rule Sets' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [ready, setReady]         = useState(false)
  const [tdsOpen, setTdsOpen]     = useState(pathname.includes('/tds'))
  const [gstOpen, setGstOpen]     = useState(pathname.includes('/gst'))
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) { router.replace('/login'); return }
    auth.me()
      .then(({ user }) => {
        if (user.role !== 'superadmin') { router.replace('/login'); return }
        setUserEmail(user.email)
        setReady(true)
      })
      .catch(() => { router.replace('/login') })
  }, [router])

  function logout() {
    localStorage.removeItem('admin_token')
    router.replace('/login')
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <span className="text-sm text-gray-400">Loading…</span>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-slate-900 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-800">
          <p className="text-white font-bold text-sm">Conceptra Admin</p>
          <p className="text-slate-400 text-xs mt-0.5 truncate">{userEmail}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
                  active ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}>
                <Icon size={15} />
                {label}
              </Link>
            )
          })}

          {/* TDS accordion */}
          <button
            onClick={() => setTdsOpen(o => !o)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
              pathname.includes('/tds') ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}>
            <FileText size={15} />
            <span className="flex-1 text-left">TDS / TCS</span>
            <ChevronDown size={13} className={`transition-transform ${tdsOpen ? 'rotate-180' : ''}`} />
          </button>

          {tdsOpen && tdsItems.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-2 pl-8 pr-3 py-1.5 rounded-lg text-sm transition ${
                  active ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-800'
                }`}>
                {label}
              </Link>
            )
          })}

          {/* GST accordion */}
          <button
            onClick={() => setGstOpen(o => !o)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
              pathname.includes('/gst') ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}>
            <Receipt size={15} />
            <span className="flex-1 text-left">GST</span>
            <ChevronDown size={13} className={`transition-transform ${gstOpen ? 'rotate-180' : ''}`} />
          </button>

          {gstOpen && gstItems.map(({ href, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-2 pl-8 pr-3 py-1.5 rounded-lg text-sm transition ${
                  active ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-800'
                }`}>
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800">
          <button onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto bg-gray-100">
        {children}
      </main>
    </div>
  )
}
